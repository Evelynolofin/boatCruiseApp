import { router, useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Animated,
  Dimensions,
  Alert,
  Platform,
  RefreshControl,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { httpClient } from "@/constants/httpClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { removeToken } from "@/constants/tokenFile";
import Modal from "react-native-modal";


const SCREEN_WIDTH = Dimensions.get("window").width;
const PANEL_WIDTH = SCREEN_WIDTH * 0.4;
const PANEL_HEIGHT = 215;
const STATUS_BAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight || 0 : 44;

interface Boat {
  boatName?: string;
  boatType?: string;
  capacity?: number;
  amenities?: string[];
  description?: string;
  media?: { url: string }[];
  pricePerHour: number;
  location?: string;
  amount?: number;
  refund?: {
    amount: number;
    percentage: number;
  }; 
}

interface Booking {
  _id: string;
  startDate: string;
  endDate: string;
  numberOfGuest: number;
  occasion: string;
  amount?: number;
  paymentStatus?: string;
  paymentReference?: string;
  boat?: Boat;
}

export default function BookingDetails() {
  const [open, setOpen] = useState (false)
  const [menuVisible, setMenuVisible] = useState<Record<string, boolean>>({});
  const openMenu = (key: string) => setMenuVisible({ ...menuVisible, [key]: true });
  const closeMenu = (key: string) => setMenuVisible({ ...menuVisible, [key]: false });

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
    
  const [profile, setProfile] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const slideAnim = useRef(new Animated.Value(PANEL_WIDTH)).current;

  function calculateDuration(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.round(diffMs / (1000 * 60 * 60));
}

  

  const { id } = useLocalSearchParams<{ id: string }>();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = async () => {
  try {
    await removeToken();

    await AsyncStorage.multiRemove([
      "token",
      "user",
      "userName",
      "userEmail",
      "userPhone",
      "bookings",
      "myBookings",
      "paymentReference",
    ]);

    delete httpClient.defaults.headers.common["Authorization"];

    setProfile(false);

    router.replace("/auth/Login");
  } catch (error) {
    Alert.alert("Error", "Failed to log out. Please try again.");
  }
};

  const fetchBooking = async () => {
    try {
      setLoading(true);
      const res = await httpClient.get(`/bookings/${id}`);
      setBooking(res.data?.data || res.data);
    } catch (error) {
      console.error("Fetch booking error:", error);
      setBooking(null);
    } finally {
      setLoading(false);
    }
    };

    useEffect(() => {
      fetchBooking();
    }, [id]);

    const onRefresh = async () => {
      setRefreshing(true);
      await fetchBooking();
      setRefreshing(false);
  };

  const boat = booking?.boat || booking?.boatId || null;

  const mainBoatImage = useMemo(() => {
    if (Array.isArray(boat?.media) && boat.media.length > 0) {
      return boat.media[0]?.url || null;
    }
    return null;
  }, [boat]);


  const bookingStatus = useMemo(() => {
  return booking?.paymentStatus?.toUpperCase() ?? "UNKNOWN";
  }, [booking?.paymentStatus]);

  const isBookingCompleted = useMemo(() => {
  if (!booking?.endDate) return false;
  return new Date(booking.endDate) <= new Date();
  }, [booking?.endDate]);


  const canCancelBooking = useMemo(() => {
    return (
      bookingStatus === "SUCCESSFUL" &&
      !isBookingCompleted &&
      !booking?.refund
    );
  }, [bookingStatus, isBookingCompleted, booking?.refund]);



  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} size="large" />;
  }

  if (!booking) {
    return (
      <View>
        <Text style={{paddingTop: 200, textAlign: 'center'}}>
          Booking not found
        </Text>
      </View>
    );
  }

  const cancelBooking = async (bookingId: string) => {
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking? You will receive a refund based on our cancellation policy.",
      [
        {
          text: "No, Keep Booking",
          style: "cancel",
        },
        {
          text: "Yes, Cancel Booking",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await httpClient.patch(`/bookings/${bookingId}/cancel`);
              const { refund, booking: updatedBooking } = res.data.data;

              setBooking((prev: Booking | null) => ({
                ...prev!,
                paymentStatus: "REFUNDED",
                refund: refund,
              }))

              Alert.alert(
                "Booking Cancelled",
                `Your booking has been cancelled successfully.\n\nRefund Amount: ₦${refund.amount.toLocaleString()}
                \nRefund Percentage: ${refund.percentage}%\n\nThe refund will be processed within 5-7 business days.`,
                [
                  {
                    text: "OK",
                    onPress: () => {
                      router.back();
                    }
                  }
                ]
              );
            } catch (error:any) {
              Alert.alert("Error", error.message);
            }
          }, 
        }
      ],

      {cancelable: false}
    );
  };



  return (
    <>
    <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

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
                  onPress={() => {
                    router.navigate('/(tabs)/HomePage')
                    setOpen(false);
                  }}
                  >
                      <Text style={{ fontSize: 16, marginBottom: 10, color: 'white', fontFamily: 'Inter_700Bold' }}>Home</Text>
                  </TouchableOpacity>
                  <TouchableOpacity>
                      <Text style={{ fontSize: 16, marginBottom: 10, color: 'white', fontFamily: 'Inter_700Bold' }}>About Us</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      router.navigate('/(tabs)/MyBookings')
                      setOpen(false);
                    }}
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
                top: -(STATUS_BAR_HEIGHT + 10),
                left: -SCREEN_WIDTH + 40,
                width: SCREEN_WIDTH,
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
                  
                  <TouchableOpacity onPress={() => router.navigate("/UserProfile")}>
                    <Text style={{fontSize: 16, marginVertical: 10,}}>Profile</Text>
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

    <ScrollView style={styles.container}
      bounces={true}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={{paddingHorizontal: 10, paddingVertical: 20}}>
        <TouchableOpacity 
            style={{flexDirection: 'row', gap: 2, alignItems:'center'}}
            onPress={() => router.navigate('/(tabs)/MyBookings')}
        >
            <Ionicons
            name="arrow-back"
            size={18}
            color='#292D329E'
            />
            <Text style={{fontWeight:400, fontSize:14, color: '#292D329E'}}>Back to My Bookings</Text>
        </TouchableOpacity>
      </View>

      <View style={{paddingHorizontal: 16}}>
        <View style={{flexDirection:'column', borderRadius: 4.6, alignItems: 'center'}}>
        {mainBoatImage && (
        <Image
          source={{ uri: mainBoatImage }}
          style={{
            height: 154.8,
            width: "100%",
            borderRadius: 3.14,
            marginTop: 10,
          }}
          resizeMode="cover"
        />
        )}
        </View>
      </View>

      <View style={{ padding: 16 }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color:
              booking.paymentStatus === "SUCCESSFUL"
                ? "green"
                : booking.paymentStatus === "PENDING"
                ? "orange"
                : booking.paymentStatus === "CANCELLED"
                ? "red"
                : "black",
          }}
        >
          {booking.paymentStatus?.toUpperCase()}
        </Text>

        <Text style={{ fontSize: 12, fontWeight: "600", marginTop: 8 }}>
          Ref: {booking.paymentReference}
        </Text>
        <Text style={{ fontSize: 20, fontWeight: "700", marginTop: 8 }}>
          {booking.boat?.boatName || "Boat Booking"}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={[styles.cardTitle, {borderBottomColor: '#dddddd', borderBottomWidth: 1, paddingVertical:10}]}>
          Trip Details
        </Text>
        <Detail label="Date" value={new Date(booking.startDate).toDateString()} />
        <Detail
          label="Time"
          value={`${new Date(booking.startDate).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })} - ${new Date(booking.endDate).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}`}
        />
        <Detail label="Duration" value={`${calculateDuration(booking.startDate, booking.endDate)} hour(s)`} />
        <Detail label="Number of Guests" value={`${booking.numberOfGuest} people`} />
        <Detail label="Occasion" value={booking.occasion || "N/A"} />
        <Detail label="Location" value={booking.boat?.location} />
      </View>

      <View style={styles.card}>
        <Text style={[styles.cardTitle, {borderBottomColor: '#dddddd', borderBottomWidth: 1, paddingVertical:10}]}>
          Yacht Information
        </Text>

        <Detail label="Type" value={booking.boat?.boatType || "N/A"} />
        <Detail
          label="Capacity"
          value={
            booking.boat?.capacity
              ? `Up to ${booking.boat.capacity} guests`
              : "N/A"
          }
        />

        {booking.boat?.amenities?.length && (
          <>
            <Text style={styles.sectionLabel}>Amenities</Text>
            <View style={styles.amenitiesWrap}>
              {booking.boat.amenities.map((item: string, i:number) => (
                <View key={i} style={styles.amenityChip}>
                  <Text style={styles.amenityText}>{item}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {booking.boat?.description && (
          <>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.description}>
              {booking.boat.description}
            </Text>
          </>
        )}
      </View>

      <View style={[styles.card, styles.paymentCard]}>
        <Text style={[styles.paymentTitle, {borderBottomColor: '#dddddd', borderBottomWidth: 1, paddingVertical:20}]}>
          Payment Summary
        </Text>
        <View style={styles.row}>
          <Text style={styles.text}>Rate per hour</Text>
          <Text style={styles.text}>{booking.boat?.pricePerHour.toLocaleString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.text}>Duration</Text>
          <Text style={styles.text}>{`${calculateDuration(booking.startDate, booking.endDate)} hour(s)`}</Text>
        </View>
        <View style={[styles.row, {borderBottomColor: '#dddddd', borderBottomWidth: 1, borderTopColor: '#dddddd', borderTopWidth: 1, paddingVertical:20}]}>
          <Text style={[styles.text, {fontSize: 18, fontFamily: 'Inter_500Medium', fontWeight: 'bold', paddingBottom: 12,}]}>
            Total Amount
          </Text>
          <Text style={[styles.text, {fontSize: 18, fontFamily: 'Inter_500Medium', fontWeight: 'bold', paddingBottom: 12,}]}>
            ₦
            {Number(
              booking.boat?.pricePerHour *
                calculateDuration(booking.startDate, booking.endDate)
            ).toLocaleString()}
          </Text>
        </View>
        <View style={[styles.row, {alignItems:'center'}]}>
          <Text style={[styles.text, {padding:5}]}>Payment Status:</Text>
          <Text style={{
            backgroundColor:
              booking.paymentStatus === "SUCCESSFUL" ? '#4CAF50' :
              booking.paymentStatus === "PENDING" ? '#FF9800' :
              booking.paymentStatus === "CANCELLED" ? '#F44336' :
              '#9d7180',
            borderRadius: 12, padding:5, color:'white', fontSize: 10, }}>
            {booking.paymentStatus?.toUpperCase()}
          </Text>
        </View>

        {booking.refund && (
          <>
            <View style={styles.row}>
              <Text style={[styles.text, {padding:5}]}>Refund Amount</Text>
              <Text style={[styles.text, {padding:5}]}>₦{Number(booking.refund.amount).toLocaleString()}</Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.text, {padding:5}]}>Refund Percentage</Text>
              <Text style={[styles.text, {padding:5}]}>{booking.refund.percentage}%</Text>
            </View>
          </>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contact Information</Text>
        <Text style={{fontSize: 16, color: "#777", paddingBottom: 20}}>
          Email
        </Text>
        <Detail
          label="BOOKED ON"
          value={new Date(booking.createdAt).toDateString()}
        />
        <Text style={{ fontSize: 14, fontWeight: "500", color: "#1A1A1A" }}>
          {new Date(booking.createdAt).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })}
        </Text>
      </View>

      {canCancelBooking && (
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => cancelBooking(booking._id)}
        >
          <Text style={styles.cancelText}>Cancel Booking</Text>
        </TouchableOpacity>
      )}

      {!canCancelBooking && (
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#666" />
          <Text style={styles.infoText}>
            {bookingStatus === "REFUNDED" &&
              "This booking has already been cancelled and refunded."}

            {bookingStatus === "CANCELLED" &&
              "This booking has been cancelled."}

            {bookingStatus === "FAILED" &&
              "Payment failed. This booking is no longer active."}

            {bookingStatus === "PENDING" &&
              "Payment is pending. Complete payment to manage this booking."}

            {bookingStatus === "SUCCESSFUL" && isBookingCompleted &&
              "This trip has already been completed."}
          </Text>
        </View>
      )}


      <View style={{ height: 40 }} />
    </ScrollView>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    backgroundColor: "#F7F7F7",
    flex: 1,
  },

  navBar:{
    backgroundColor:'#1A1A1A',
    height: 50 + STATUS_BAR_HEIGHT,
    paddingTop: STATUS_BAR_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },

  panel: {
    position: "absolute",
    right: 0,
    top: STATUS_BAR_HEIGHT + 10,
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

   sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 6,
    color: "#666",
  },

  amenitiesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  amenityChip: {
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  amenityText: {
    fontSize: 12,
    color: "#4F46E5",
    fontWeight: "500",
  },

  description: {
    fontSize: 13,
    color: "#444",
    lineHeight: 18,
  },

  text:{
    color: 'white', 
    fontSize: 12, 
    fontFamily: 'Inter_400Regular',
    fontWeight: 400,
    paddingBottom: 12,
  },

  back: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 6,
  },
  backText: {
    color: "#444",
    fontSize: 14,
  },

  hero: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginHorizontal: 16,
  },

  header: {
    padding: 16,
  },

  ref: {
    marginTop: 6,
    color: "#777",
    fontSize: 12,
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
  },

  company: {
    color: "#777",
    fontSize: 13,
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    padding: 16,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },

  detailRow: {
    marginBottom: 12,
  },

  detailLabel: {
    fontSize: 16,
    color: "#777",
    paddingBottom: 5
  },

  detailValue: {
    fontSize: 14,
    fontWeight: "500",
  },

  paymentCard: {
    backgroundColor: "#6C6FD3",
  },

  paymentTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },


  cancelBtn: {
    marginTop: 20,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: "#FF3B30",
    borderRadius: 12,
    padding: 14,
  },

  cancelText: {
    color: "#FF3B30",
    textAlign: "center",
    fontWeight: "600",
  },

  infoBox: {
    marginTop: 20,
    marginHorizontal: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  infoText: {
    flex: 1,
    color: "#666",
    fontSize: 13,
    lineHeight: 18,
  },
});

