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
  Image
} from "react-native";
import Modal from "react-native-modal";
import { router } from "expo-router";
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
}

type TabType = "upcoming" | "past";
type StatusTabType = "all" | "paid" | "pending" | "cancelled";

const SCREEN_WIDTH = Dimensions.get("window").width;
const PANEL_WIDTH = SCREEN_WIDTH * 0.5;
const PANEL_HEIGHT = 215;
const { height } = Dimensions.get("window");

export default function BookingDetails() {
   const [open, setOpen] = useState (false)
  
      const [profile, setProfile] = useState(false);
      const slideAnim = useRef(new Animated.Value(PANEL_WIDTH)).current;
      const dropAnim = useRef(new Animated.Value(-PANEL_HEIGHT)).current;
  
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
  const [statusTab, setStatusTab] = useState<StatusTabType>("all");
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  const now = new Date();
  const ONE_HOUR = 60 * 60 * 1000;

  const handleLogout = async () => {
  try {
    console.log("Starting logout...");

    await AsyncStorage.removeItem("token");
    console.log("Token removed successfully");

    await AsyncStorage.removeItem("user");
    console.log("User data removed successfully");

    delete httpClient.defaults.headers.common["Authorization"];
    console.log("Authorization header cleared");

    setProfile(false);
    console.log("Profile state set to false");

    router.replace("/auth/Login");
    console.log("Redirected to login page");
    
    console.log("Logout completed successfully");

  } catch (error) {
    console.error("Logout failed", error);
  }
};

  const getMyBookings = async () => {
    try {
      setLoadingBookings(true);
      const res = await httpClient.get("/bookings");
      const bookings: Booking[] = res.data?.data || res.data?.bookings || res.data || [];
      setMyBookings(bookings);
    } catch (err: any) {
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

  const upcomingBookings = useMemo(() => {
    return myBookings.filter((b) => {
      const endTime = new Date(b.endDate).getTime();
      const startTime = new Date(b.startDate).getTime();
      const isPaid = b.paymentStatus === "success" || b.paymentStatus === "paid";

      if (isPaid && endTime > now.getTime()) return true;
      if (!isPaid && now.getTime() - startTime <= ONE_HOUR) return true;
      return false;
    });
  }, [myBookings]);

  const pastBookings = useMemo(() => {
    return myBookings.filter((b) => {
      const endTime = new Date(b.endDate).getTime();
      const startTime = new Date(b.startDate).getTime();
      const isPaid = b.paymentStatus === "success" || b.paymentStatus === "paid";

      if (isPaid && endTime <= now.getTime()) return true;
      if (!isPaid && now.getTime() - startTime > ONE_HOUR) return true;
      return false;
    });
  }, [myBookings]);

  const filteredBookings = useMemo(() => {
    const list = activeTab === "upcoming" ? upcomingBookings : pastBookings;
    if (statusTab === "all") return list;
    return list.filter((b) => b.paymentStatus === statusTab);
  }, [activeTab, statusTab, upcomingBookings, pastBookings]);

  const getBookingById = async (bookingId: string) => {
    try {
      setLoadingBookings(true);
      const res = await httpClient.get(`/bookings/${bookingId}`);
      setCurrentBooking(res.data?.data || res.data);
      setDetailsModalVisible(true);
    } catch {
      Alert.alert("Error", "Failed to load booking details");
    } finally {
      setLoadingBookings(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    Alert.alert("Cancel Booking", "Are you sure?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await httpClient.patch(`/bookings/${bookingId}/cancel`);
            const updatedBooking = res.data?.data?.booking;
            const updatedPaymentStatus = updatedBooking?.status?.toLowerCase() || "cancelled";

            setMyBookings((prev) =>
              prev.map((b) =>
                b._id === bookingId
                  ? { ...b, paymentStatus: updatedPaymentStatus, refund: res.data?.data?.refund }
                  : b
              )
            );

            if (currentBooking?._id === bookingId) {
              setCurrentBooking((prev) =>
                prev
                  ? { ...prev, paymentStatus: updatedPaymentStatus, refund: res.data?.data?.refund }
                  : prev
              );
            }

            Alert.alert("Success", res.data?.message || "Booking cancelled successfully");
          } catch {
            Alert.alert("Error", "Cancellation failed");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />
      <View style={styles.navBar}>
        <View style={{flexDirection:'row', gap: 5, alignItems:'center'}}>
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

        <View style={{flexDirection:'row', gap: 5, justifyContent:'space-between', width:64}}>
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
                    onPress={() => router.navigate('/(tabs)/BookingDetails')}
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
                    <Text style={{fontSize: 18, fontWeight: "bold", marginBottom: 20,}}>User Profile</Text>
                    {/* <Text style={{fontSize: 16, marginVertical: 10,}}>{user.email}</Text> */}
                    <TouchableOpacity>
                      <Text style={{fontSize: 16, marginVertical: 10,}}>Settings</Text>
                    </TouchableOpacity>
                    <TouchableOpacity>
                      <Text style={{fontSize: 16, marginVertical: 10,}}>Change Number</Text>
                    </TouchableOpacity>
                    <TouchableOpacity>
                      <Text style={{fontSize: 16, marginVertical: 10,}}>Change Password</Text>
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

      <View style={styles.statusTabsContainer}>
        {["all", "paid", "pending", "cancelled"].map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.statusTab, statusTab === status && styles.activeStatusTab]}
            onPress={() => setStatusTab(status as StatusTabType)}
          >
            <Text style={[styles.statusTabText, statusTab === status && styles.activeStatusTabText]}>
              {status.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* <View>
        <Image
          source={currentBooking?.media}
        />
      </View> */}

      {loadingBookings && myBookings.length === 0 ? (
        <ActivityIndicator size="large" />
      ) : filteredBookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No {activeTab} bookings for "{statusTab}" status
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshBookings} />}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onViewDetails={() => getBookingById(item._id)}
              onCancel={() => cancelBooking(item._id)}
            />
          )}
        />
      )}

      <Modal
        isVisible={detailsModalVisible}
        onBackdropPress={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Booking Details</Text>
          {currentBooking && (
            <>
              <Text>Boat: {currentBooking.boatName}</Text>
              <Text>Guests: {currentBooking.numberOfGuest}</Text>
              <Text>Status: {currentBooking.paymentStatus}</Text>
              <Text>
                Date: {new Date(currentBooking.startDate).toLocaleString()} -{" "}
                {new Date(currentBooking.endDate).toLocaleString()}
              </Text>
              {currentBooking.specialRequest && <Text>Special Request: {currentBooking.specialRequest}</Text>}

              {currentBooking.paymentStatus === "cancelled" && currentBooking.refund && (
                <Text style={{ color: "#10B981", marginTop: 8 }}>
                  Refund: ₦{currentBooking.refund.amount} ({currentBooking.refund.percentage}%)
                </Text>
              )}

              {currentBooking.paymentStatus === "success" && (
                <TouchableOpacity
                  onPress={() => cancelBooking(currentBooking._id)}
                  style={[styles.cancelBtn, { marginTop: 12 }]}
                >
                  <Text style={styles.cancelText}>Cancel Booking</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          <TouchableOpacity
            onPress={() => setDetailsModalVisible(false)}
            style={styles.modalClose}
          >
            <Text style={{ color: "red" }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const BookingCard = ({
  booking,
  onViewDetails,
  onCancel,
}: {
  booking: Booking;
  onViewDetails: () => void;
  onCancel: () => void;
}) => (
  <View style={styles.bookingCard}>
    <Text style={styles.occasion}>{booking.occasion}</Text>
    <Text>{booking.boatName}</Text>
    <Text>
      {new Date(booking.startDate).toLocaleDateString()} •{" "}
      {new Date(booking.startDate).toLocaleTimeString()} -{" "}
      {new Date(booking.endDate).toLocaleTimeString()}
    </Text>
    <Text>Status: {booking.paymentStatus}</Text>

    <View style={styles.actions}>
      <TouchableOpacity style={styles.viewBtn} onPress={onViewDetails}>
        <Text style={styles.viewBtnText}>View Details</Text>
      </TouchableOpacity>

      {booking.paymentStatus === "success" && (
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel Booking</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);


const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F8F8F8" 
  },

  navBar:{
    backgroundColor:'#1A1A1A',
    height: 70,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
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
    borderBottomLeftRadius:7,
    borderTopLeftRadius:7
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

  statusTabsContainer: { 
    flexDirection: "row", 
    marginHorizontal: 10, 
    marginTop: 8, 
    marginBottom: 16 
  },

  statusTab: { 
    flex: 1, 
    marginHorizontal: 3, 
    borderRadius: 12, 
    backgroundColor: "#EEE", 
    alignItems: "center",
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },

  activeStatusTab: { 
    backgroundColor: "#000",
    paddingHorizontal: 3, 
    paddingVertical: 9, 
  },

  statusTabText: { 
    color: "#555", 
    fontWeight: "600",
    fontSize: 12
  },

  activeStatusTabText: { 
    color: "#FFF"
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

  actions: { 
    flexDirection: "row", 
    marginTop: 12, 
    gap: 8 
  },

  viewBtn: { 
    flex: 1, 
    backgroundColor: "#000", 
    padding: 10, 
    borderRadius: 8, 
    alignItems: "center" 
  },

  viewBtnText: { 
    color: "#FFF" 
  },

  cancelBtn: { 
    flex: 1, 
    backgroundColor: "#FFE5E5", 
    padding: 10, 
    borderRadius: 8, 
    alignItems: "center" 
  },

  cancelText: { 
    color: "red" 
  },

  emptyContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },

  emptyText: { 
    color: "#666" 
  },

  modalContainer: { 
    backgroundColor: "#FFF", 
    borderRadius: 12, 
    padding: 20 
  },

  modalTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    marginBottom: 12 
  },

  modalClose: { 
    marginTop: 20, 
    alignSelf: "flex-end"
  },
});
