import { useState, useEffect, useMemo, useRef } from "react";
import { httpClient } from "@/constants/httpClient";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Animated,
  Image,
} from "react-native";
import Modal from "react-native-modal";
import { useRouter } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Booking {
  _id: string;
  boatId: string;
  boatName?: string;
  startDate: string;
  endDate: string;
  numberOfGuest: number;
  occasion: string;
  specialRequest?: string;
  paymentStatus?: string; 
  paymentReference?: string;
  amount?: number;
  media: string;
  location?: string;
  refund?: {
    amount: number;
    percentage: number;
  };
  createdAt: string;
}

type TabType = "upcoming" | "past";

const SCREEN_WIDTH = Dimensions.get("window").width;
const PANEL_WIDTH = SCREEN_WIDTH * 0.4;
const TWO_HOURS = 2 * 60 * 60 * 1000;

export default function MyBookings() {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(false);
  const slideAnim = useRef(new Animated.Value(PANEL_WIDTH)).current;

  const openPanel = () => {
    setProfile(true);
    slideAnim.setValue(PANEL_WIDTH);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closePanel = () => {
    Animated.timing(slideAnim, {
      toValue: PANEL_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setProfile(false));
  };

  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const now = Date.now();

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      delete httpClient.defaults.headers.common["Authorization"];
      setProfile(false);
      router.replace("/auth/Login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const getMyBookings = async () => {
    try {
      setLoadingBookings(true);
      const res = await httpClient.get("/bookings");
      const bookings: Booking[] =
        res.data?.data || res.data?.bookings || res.data || [];
      setMyBookings(bookings);
    } catch {
      Alert.alert("Error", "Failed to load bookings");
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    getMyBookings();
  }, []);

  const refreshBookings = async () => {
    setRefreshing(true);
    await getMyBookings();
    setRefreshing(false);
  };

  const { upcomingBookings, pastBookings } = useMemo(() => {
  const upcoming: Booking[] = [];
  const past: Booking[] = [];

  myBookings.forEach((b) => {
    const startTime = new Date(b.startDate).getTime();
    const endTime = new Date(b.endDate).getTime();
    const createdTime = new Date(b.createdAt).getTime();
    const age = now - createdTime;


    const isPaid =
      b.paymentStatus === "paid" || b.paymentStatus === "success";

    if (!isPaid && age > TWO_HOURS) {
      past.push({
        ...b,
        paymentStatus: "cancelled",
      });
      return;
    }

    if (isPaid && endTime > now) {
      upcoming.push(b);
      return;
    }

    if (!isPaid && age <= TWO_HOURS) {
      upcoming.push(b);
      return;
    }

    past.push(b);
  });

  return { upcomingBookings: upcoming, pastBookings: past };
}, [myBookings, now]);

const filteredBookings =
  activeTab === "upcoming" ? upcomingBookings : pastBookings;

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />

      <View style={styles.navBar}>
        <View style={{flexDirection:'row', gap: 5, alignItems:'center', paddingTop: 20}}>
            <Image
            source={require('@/assets/images/logo.png')}
            style={{
                width: 23.32,
                height: 23.32,
            }}
            />
            <Text style={{color: 'white', fontWeight:700, fontSize: 11.66}}>
                BoatCruise
            </Text>
        </View>
      
        <View style={{flexDirection:'row', gap: 5, justifyContent:'space-between', width:64, paddingTop: 20}}>
            <TouchableOpacity onPress={() => setOpen(true)}>
                <Ionicons
                name="menu"
                size={24}
                color='white'
                />
                <Modal isVisible={open} onBackdropPress={() => setOpen(false)}>
                    <View style={{ backgroundColor: "black", padding: 20, borderRadius: 10 }}>
                    <TouchableOpacity
                    onPress={() => router.navigate('/(tabs)/HomePage')}
                    >
                        <Text style={{ fontSize: 16, marginBottom: 10, color: 'white', fontFamily: 'Inter_700Bold' }}>Home</Text>
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Text style={{ fontSize: 16, marginBottom: 10, color: 'white', fontFamily: 'Inter_700Bold' }}>About Us</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                    onPress={() => router.navigate('/(tabs)/MyBookings')}
                    >
                        <Text style={{ fontSize: 16, marginBottom: 10, color: 'white', fontFamily: 'Inter_700Bold' }}>
                        My bookings
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setOpen(false)}>
                        <Text style={{ color: "red", fontSize: 16, fontFamily: 'Inter_700Bold' }}>Cancel</Text>
                    </TouchableOpacity>
                    </View>
                </Modal>

            </TouchableOpacity>

            <View>
                <TouchableOpacity
                onPress={openPanel}
                style={{width: 24, height: 24, borderRadius: 60, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'white'}}
                >
                    <Feather
                    name="user"
                    size={16}
                    color='white'
                    />
                </TouchableOpacity>

                {profile && (
                <View
                    style={{
                    position: 'absolute',
                    top: 0,
                    left: 40,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    zIndex: 9,
                }}
                >
                    <Animated.View
                    style={[
                    styles.panel,
                    { transform: [{ translateX: slideAnim }] },
                    ]}
                    >
                        <TouchableOpacity
                        onPress={() => router.navigate("/(tabs)/UserProfile")}
                        >
                        <Text style={{fontSize: 16, marginVertical: 10,}}>
                            Profile
                        </Text>
                        </TouchableOpacity>
                        <TouchableOpacity>
                        <Text style={{fontSize: 16, marginVertical: 10,}}>Settings</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                        onPress={handleLogout}
                        >
                        <Text style={{fontSize: 16, marginVertical: 10,}}>Logout</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={closePanel}>
                        <Text style={{marginTop: 30, color: "red", fontWeight: "bold",}}>Close</Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
                )}
            </View>
        </View>
     </View>

     <View style={{paddingHorizontal: 10, paddingVertical: 20}}>
        <TouchableOpacity 
            style={{flexDirection: 'row', gap: 2, alignItems:'center'}}
            onPress={() => router.navigate('/(tabs)/FeaturedYacht')}
        >
            <Ionicons
            name="arrow-back"
            size={18}
            color='#292D329E'
         />
         <Text style={{fontWeight:400, fontSize:14, color: '#292D329E'}}>Go back</Text>
        </TouchableOpacity>
     </View>

      <Text style={styles.headerTitle}>My Bookings</Text>

      <View style={styles.tabsContainer}>
        {["upcoming", "past"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab as TabType)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.toUpperCase()} ({tab === "upcoming" ? upcomingBookings.length : pastBookings.length})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loadingBookings && myBookings.length === 0 ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : filteredBookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No {activeTab} bookings available
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshBookings} />}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => <BookingCard booking={item} />}
        />
      )}
    </View>
  );
}

const BookingCard = ({ booking }: { booking: Booking }) => {
  const router = useRouter();

  return (
    <View style={styles.bookingCard}>
      <Text style={styles.occasion}>{booking.occasion}</Text>
      <Text>{booking.boatName}</Text>
      <Text>
        {new Date(booking.startDate).toLocaleDateString()} •{" "}
        {new Date(booking.startDate).toLocaleTimeString()} -{" "}
        {new Date(booking.endDate).toLocaleTimeString()}
      </Text>
      <Text>Status: {booking.paymentStatus?.toUpperCase()}</Text>

        

      <TouchableOpacity
        style={{
          backgroundColor: "#1A1A1A",
          borderRadius: 28.3,
          padding: 16,
          marginBottom: 50,
          marginHorizontal: 14,
          marginTop: 20,
        }}
        onPress={() =>
          router.push({
            pathname: "/(tabs)/BookingDetails",
            params: { id: booking._id },
          })
        }
      >
        <Text
          style={{
            fontFamily: "Inter_500Medium",
            fontWeight: "500",
            fontSize: 12,
            color: "white",
            textAlign: "center",
          }}
        >
          View Details
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F8F8F8" 
},

  navBar: { 
    backgroundColor: "#1A1A1A", 
    height: 70, 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingHorizontal: 10 
},

  panel: { 
    position: "absolute", 
    right: 0, 
    top: 0, 
    width: PANEL_WIDTH, 
    backgroundColor: "#fff", 
    padding: 20, 
    elevation: 8, 
    shadowColor: "#000", 
    shadowOpacity: 0.2, 
    shadowRadius: 6, 
    borderBottomLeftRadius: 7, 
    borderTopLeftRadius: 7 
},

  overlay: { 
    position: "absolute", 
    inset: 0, 
    backgroundColor: "rgba(0,0,0,0.3)" 
},

  headerTitle: { 
    fontSize: 22, 
    fontWeight: "700", 
    padding: 16 
},

  tabsContainer: { 
    flexDirection: "row", 
    backgroundColor: "#EFEFEF", 
    marginHorizontal: 16, 
    borderRadius: 24, 
    padding: 4 
},

  tab: { 
    flex: 1, 
    paddingVertical: 10, 
    alignItems: "center", 
    borderRadius: 20 
},

  activeTab: { 
    backgroundColor: "#FFF" 
},

  tabText: { 
    color: "#777", 
    fontWeight: "600" 
},

  activeTabText: { 
    color: "#000" 
},

  bookingCard: { 
    backgroundColor: "#FFF", 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 16, 
    elevation: 3 
},

  occasion: { 
    fontSize: 16, 
    fontWeight: "700" 
},

  emptyContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
},

  emptyText: { 
    color: "#666" 
},
});
