import { ScrollView,
        Text,
        Image,
        View,
        StatusBar,
        StyleSheet,
        TouchableOpacity,
        Dimensions,
        Animated,
        ActivityIndicator,
 } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useState, useRef, useEffect } from "react";
import Modal from "react-native-modal";
import { router, useLocalSearchParams } from "expo-router";
import {httpClient} from "@/constants/httpClient";

type BookingParams = {
  fullName?: string;
  email?: string;
  phone?: string;
  date?: string;
  duration?: string;
  guest?: string;
  occasion?: string;
  total?: string;
  startTime?: string;
  endTime?: string
};

const SCREEN_WIDTH = Dimensions.get("window").width;
const PANEL_WIDTH = SCREEN_WIDTH * 0.4;
const { height } = Dimensions.get("window");
const NAVBAR_HEIGHT = 70;


export default function BookingDetails(){

    const params = useLocalSearchParams<BookingParams>();

    const [open, setOpen] = useState (false)

    const [menuVisible, setMenuVisible] = useState<Record<string, boolean>>({});
    const options = ['Low Price', 'High Price'];

    const openMenu = (key: string) => setMenuVisible({ ...menuVisible, [key]: true });
    const closeMenu = (key: string) => setMenuVisible({ ...menuVisible, [key]: false });

    const handleSelect = (key: string, value: string) => {
        closeMenu(key);
    };

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
              

    
    const [startTime, setStartTime] = useState<Date>(new Date());
    const [endTime, setEndTime] = useState<Date>(new Date());


    const booking = {
        fullName: params.fullName ?? "",
        email: params.email ?? "",
        phone: params.phone ?? "",
        date: params.date ?? "",
        startTime: params.startTime ?? "",
        endTime: params.endTime ?? "",
        duration: params.duration ?? "",
        guest: Number(params.guest ?? ""),
        occasion: params.occasion ?? "",
        total: Number(params.total ?? 0),
    }
    return(
        <>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <ScrollView style={{ backgroundColor: "#F8F8F8" }}>
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
                            <TouchableOpacity>
                                <Text style={{fontSize: 16, marginVertical: 10,}}>Settings</Text>
                            </TouchableOpacity>
                            <TouchableOpacity>
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
                  
              
                <View style={{marginTop: 50}}>
                    <Text style={[styles.header,{marginHorizontal: 16}]}>My Booking</Text>

                    <View style={styles.card}>
                        <View style={styles.topRow}>
                        <View style={{ flexDirection: "row", gap: 10 }}>
                            <Image
                            source={require("@/assets/images/yacht21.png")}
                            style={styles.image}
                            />
            
                            <View>
                            <Text style={styles.yachtName}>The Serenity Yacht</Text>
                            <Text style={styles.category}>Luxury Yacht</Text>
            
                            <View style={styles.metaRow}>
                                <Ionicons name="calendar-outline" size={14} color="#6A7282" />
                                <Text style={styles.metaText}>
                                  {booking.date}
                                </Text>
                            </View>
            
                            <View style={styles.metaRow}>
                                <Ionicons name="people-outline" size={14} color="#6A7282" />
                                <Text style={styles.metaText}>
                                {booking.guest} guests
                                </Text>
                            </View>
                            </View>
                        </View>
            
                        <View style={{ alignItems: "flex-end" }}>
                            <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>Confirmed</Text>
                            </View>
                            <Feather name="more-vertical" size={18} />
                        </View>
                        </View>
            
                        <View style={styles.divider} />

                        <View style={styles.detailsRow}>
                        <View style={styles.detailItem}>
                            <Ionicons name="time-outline" size={14} color="#6A7282" />
                            <Text style={styles.detailText}>
                              {startTime.toLocaleTimeString([], {hour: "2-digit", hour12: true,})} {"-"}
                              {endTime.toLocaleTimeString([], {hour: "2-digit", hour12: true,})}
                            </Text>
                        </View>
            
                        <View style={styles.detailItem}>
                            <Ionicons name="location-outline" size={14} color="#6A7282" />
                            <Text style={styles.detailText}>Lagos</Text>
                        </View>
                        </View>
            
                        <View style={styles.divider} />
            
                        <View style={styles.footer}>
                        <Text style={styles.bookingId}>Booking ID: BK-102938</Text>
            
                        <View style={{ alignItems: "flex-end" }}>
                            <Text style={styles.totalLabel}>Total Paid</Text>
                            <Text style={styles.totalAmount}>
                            ₦{booking.total.toLocaleString()}
                            </Text>
                        </View>
                        </View>        
                    </View>

                    <TouchableOpacity
                        onPress={() => router.navigate('/(tabs)/HomePage')}
                        style={{backgroundColor: '#1A1A1A', borderRadius: 26.16, padding: 15, marginBottom: 10,
                            marginTop: 20, marginHorizontal: 16
                        }}
                    >
                        <Text style={{textAlign:'center', fontFamily: 'Inter_500Medium', fontWeight: 500, fontSize:12, color:'white'}}>Go back to Home</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </> 
    )
}


const styles = StyleSheet.create({
  container: {
    padding: 16,
  },

  navBar:{
        backgroundColor:'#1A1A1A',
        height: NAVBAR_HEIGHT,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 10,
        // elevation: 100
        // position: 'absolute',

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

  header: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },

  tabs: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },

  tab: {
    backgroundColor: "#EDEDED",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },

  activeTab: {
    backgroundColor: "#000",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },

  tabText: {
    fontSize: 12,
    color: "#000",
  },

  activeTabText: {
    fontSize: 12,
    color: "#fff",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },

  yachtName: {
    fontSize: 14,
    fontWeight: "600",
  },

  category: {
    fontSize: 12,
    color: "#6A7282",
    marginBottom: 6,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  metaText: {
    fontSize: 12,
    color: "#6A7282",
  },

  statusBadge: {
    backgroundColor: "#E8F7ED",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },

  statusText: {
    fontSize: 10,
    color: "#16A34A",
    fontWeight: "500",
  },

  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },

  detailsRow: {
    gap: 8,
  },

  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  detailText: {
    fontSize: 12,
    color: "#374151",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  bookingId: {
    fontSize: 12,
    color: "#6A7282",
  },

  totalLabel: {
    fontSize: 10,
    color: "#6A7282",
  },

  totalAmount: {
    fontSize: 14,
    fontWeight: "600",
  },

  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  primaryBtn: {
    flex: 1,
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 24,
    alignItems: "center",
  },

  primaryBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },

  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#000",
    padding: 12,
    borderRadius: 24,
    alignItems: "center",
  },

  secondaryBtnText: {
    fontSize: 12,
    fontWeight: "500",
  },
});