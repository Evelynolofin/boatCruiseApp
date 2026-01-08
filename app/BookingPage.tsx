import { httpClient } from "@/constants/httpClient";
import { Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useRef, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import Modal from "react-native-modal";
import { WebView } from "react-native-webview";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from 'expo-web-browser';
import { getToken, removeToken } from "@/constants/tokenFile";
import axios from "axios";


type Media = {
  url: string;
};

type Boat = {
  _id: string;
  pricePerHour: number;
  capacity: number;
  location:{name:string};
  reviews: number;
  imageUrl: string;
  boatType: string;
  boatName: string;
  companyName: string;
  image: string;
  media?: Media[];
};

type UserParams = {
  email?: string,
  resumeBooking?: string;
  selectedDate?: string;
  startTime?: string;
  endTime?: string;
  guest?: string;
  occasion?: string;
  specialRequest?: string;
};

const BOAT_ID = "69445fc8fe4ff64c16f382be";


const SCREEN_WIDTH = Dimensions.get("window").width;
const PANEL_WIDTH = SCREEN_WIDTH * 0.5;
const PANEL_HEIGHT = 215;
const { height } = Dimensions.get("window");

const generateHourSlots = () => {
  const slots: string[] = [];
  for (let h = 0; h < 25; h++) {
    slots.push(`${h.toString().padStart(2, "0")}:00`);
  }
  return slots;
};

const buildISODateTime = (date: string, time: Date) => {
  const d = new Date(date);
  d.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return d.toISOString();
};

export default function BookingPage(){
    const params = useLocalSearchParams<UserParams>();
    const [paymentReference, setPaymentReference] = useState<string | null>(null)
    const { boatId } = useLocalSearchParams<{ boatId: string }>();

    const [boat, setBoat] = useState<Boat | null>(null);


    const [open, setOpen] = useState (false)

    const [profile, setProfile] = useState(false);
    const slideAnim = useRef(new Animated.Value(PANEL_WIDTH)).current;
    const dropAnim = useRef(new Animated.Value(-PANEL_HEIGHT)).current;

    const webViewRef = useRef<WebView>(null);

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

    const [step, setStep] = useState(1)

     const goNext = () => {
    if (step < 3) setStep(step + 1);
    };

    const goBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const [fullName, setFullName] = useState(" ");
    const [email, setEmail] = useState(params.email ?? "");
    const [phone, setPhone] = useState(" ");

    const emailRef = useRef<TextInput>(null);
    const phoneRef = useRef<TextInput>(null)

    
    const [selectedDate, setSelectedDate] = useState<string | null>(null)

    const [guest, setGuest] = useState(0);

    const [occasion, setOccassion] = useState('');
    const [occasionMenu, setOccassionMenu] = useState(false);
    
    const [specialRequest, setSpecialRequest] = useState("");

    const [paystackUrl, setPaystackUrl] = useState<string | null>(null);

    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
      AsyncStorage.getItem("userEmail").then((email) => {
        setUserEmail(email);
      });
    }, []);

    

    const occasionOpt = [
      'Birthday Celebration',
      'Wedding Event',
      'Anniversary',
      'Friends Hangout',
      'Corporate Event',
      'Private Cruise'
    ]

    const openOccassionMenu = () => {
      setOccassionMenu(true);
      Animated.timing(dropAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    };

    const closeOccassionMenu = () => {
      Animated.timing(dropAnim, {
        toValue: -PANEL_HEIGHT,
        duration: 0,
        useNativeDriver: true,
      }).start(() => setOccassionMenu(false));
    };

    const extractReference = (url: string): string => {
    const match = url.match(/reference=([^&]+)/);
      return match?.[1] ?? "";
    };


    const timeSlots = generateHourSlots();
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date());
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showStartDropdown, setShowStartDropdown] = useState(false);
    const [showEndDropdown, setShowEndDropdown] = useState(false);
    const [editingRestoredBooking, setEditingRestoredBooking] = useState(false);

    const [isVerifying, setIsVerifying] = useState(false);
    const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);

    
    const [bookedSlots, setBookedSlots] = useState<
      { start: string; end: string }[]
    >([]);

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false);

    const openCalendar = () => {
        setCalendarOpen(true);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      };
    
    const closeCalendar = () => {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setCalendarOpen(false));
    };

    
    useEffect(() => {
        const id = boatId || BOAT_ID;
    
        const fetchBoat = async () => {
          try {
            setLoading(true);
           const res = await httpClient.get(`/boats/${id}`);
            const boatData = res.data?.data || res.data;
  
            setBoat(boatData);
          } catch (err) {
            Alert.alert("Error", "Failed to load boat price");
          } finally {
            setLoading(false);
          }
        };
    
        fetchBoat();
      }, [boatId]);

    const duration = useMemo(() => {
    const diffMs = endTime.getTime() - startTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours;
    }, [startTime, endTime]);

    const pricePerHour = useMemo(() => {
    return Number(boat?.pricePerHour || 0);
  }, [boat]);

    const totalAmount = useMemo(() => {
    if (!pricePerHour || duration <= 0) return 0;
    return Math.round(duration * pricePerHour);
  }, [duration, pricePerHour]);

    const [method, setMethod] = useState<"card" |"bank" | null> (null);

    const toggleMethod =(selected: "card" | 'bank') =>{
      setMethod(method === selected ? null : selected);
    }

    let boatName: string = boat?.boatName || "Unknown Boat";    
    
    const goToMyBookings = () => {
    router.push({
      pathname: "/BookingDetails",
        params: {
        fullName,
        email,
        phone,
        date: selectedDate,
        startTime: startTime.toISOString(),
        endTime: startTime.toISOString(),
        duration: duration.toString(),
        guest: guest.toString(),
        occasion: occasion,
        total: totalAmount.toString(),
        paymentReference,
        boatName,
 
      },
    });
};

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
    console.error("Logout failed", error);
  }
};


const mainBoatImage = useMemo(() => {
  if (Array.isArray(boat?.media) && boat.media.length > 0) {
    return boat.media[0].url;
  }
  return null;
}, [boat]);

useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem("userEmail");
        const savedFullName = await AsyncStorage.getItem("userName");
        const savedPhone = await AsyncStorage.getItem("userPhone");

        if (savedEmail) setEmail(savedEmail);
        if (savedFullName) setFullName(savedFullName);
        if (savedPhone) setPhone(savedPhone);

        if (params.resumeBooking === "true") {
          setEditingRestoredBooking(true);

          if (params.selectedDate){
            setSelectedDate(params.selectedDate as string);
          }

          if (params.startTime) {
            const startTime = params.startTime as string;
            const parsedStart = new Date (startTime);

            if (!isNaN(parsedStart.getTime())) {
            setStartTime(parsedStart);
            } else {
              console.error("Invalid startTime:", startTime);
            }
          }

          if (params.endTime) {
          const endTime = params.endTime as string;
          const parsedEnd = new Date(endTime);
          
          if (!isNaN(parsedEnd.getTime())) {
            setEndTime(parsedEnd);
          } else {
            console.error("Invalid endTime:", endTime);
          }
        }

        if (params.guest) {
          const guest = params.guest as string;
          const guestNum = parseInt(guest, 10);
          
          if (!isNaN(guestNum) && guestNum > 0) {
            setGuest(guestNum);
          } else {
            setGuest(0);
          }
        }

        if (params.occasion) {
          setOccassion(params.occasion as string);
        }
        
        if (params.specialRequest) {
          setSpecialRequest(params.specialRequest as string);
        }
        
      } else {
        const savedBooking = await AsyncStorage.getItem('pendingBooking');
        if (savedBooking) {
          const data = JSON.parse(savedBooking);
          
          setEditingRestoredBooking(true);
          
          if (data.selectedDate) setSelectedDate(data.selectedDate);
          if (data.startTime) setStartTime(new Date(data.startTime));
          if (data.endTime) setEndTime(new Date(data.endTime));
          if (data.guest) {
            const guestNum = typeof data.guest === 'string' ? parseInt(data.guest, 10) : data.guest;
            setGuest(guestNum);
          }
          if (data.occasion) setOccassion(data.occasion);
          if (data.specialRequest) setSpecialRequest(data.specialRequest || '');
        }
      }
    } catch (err) {
      console.log("Error loading user info:", err);
    }
  };
    loadUserInfo();
}, []);


// useEffect(() => {
//   if (!selectedDate) return;

//   setBookedSlots([
//     { start: "10:00", end: "12:00" },
//     { start: "15:00", end: "17:00" },
//   ]);

//   setShowStartDropdown(false);
//   setShowEndDropdown(false);
// }, [selectedDate]);


// const isTimeBooked = (time: Date) => {
//   return bookedSlots.some((slot) => {
//     const [sh, sm] = slot.start.split(":").map(Number);
//     const [eh, em] = slot.end.split(":").map(Number);

//     const start = new Date(time);
//     start.setHours(sh, sm || 0, 0, 0);

//     const end = new Date(time);
//     end.setHours(eh, em || 0, 0, 0);

//     return time >= start && time < end;
//   });
// };

// const isToday =
//   selectedDate === new Date().toISOString().split("T")[0];

const createBooking = async () => {
  const token = await getToken();
  if (!token) {
    const bookingData = {
      boatId: boatId || BOAT_ID,
      selectedDate,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      guest: guest.toString(),
      occasion,
      specialRequest,
      isGuest: true, 
    };
    await AsyncStorage.setItem('pendingBooking', JSON.stringify(bookingData));

    Alert.alert(
      "Login required",
      "You must be logged in to make a booking.",
      [
        {
          text: "Go to Login",
          onPress: () => router.push("/auth/Login"),
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
    return;
  }
  
  if (!selectedDate) return Alert.alert("Error", "Select a date");
  if (endTime <= startTime) return Alert.alert("Error", "End time must be after start time");
  if (!guest) return Alert.alert("Error", "Select Guest");
  if (!occasion) return Alert.alert("Error", "Select occasion");

  try {
    setLoading(true);

    const res = await httpClient.post("/bookings/initialize", {
      boatId: boatId || BOAT_ID,
      startDate: buildISODateTime(selectedDate, startTime),
      endDate: buildISODateTime(selectedDate, endTime),
      numberOfGuest: guest,
      occasion,
      specialRequest,
    });

    console.log("Booking initialized:", res.data);

    const responseData = res.data?.data || res.data;
    if (!responseData) {
      Alert.alert("Error", "Invalid response from server");
      return;
    }

    const paymentReference =
      responseData.paymentReference || responseData.reference || responseData.payment_reference;
    
    const paystackLink =
      responseData.paymentUrl || responseData.authorization_url || responseData.authorizationUrl || responseData.payment_url;

    if (!paystackLink || !paymentReference) {
      Alert.alert("Error", "Payment could not be initialized");
      return;
    }

    setPaymentReference(paymentReference);
    setLoading(false);

    console.log("Opening payment URL:", paystackLink);
    console.log("Payment reference:", paymentReference);

    const browserResult = await WebBrowser.openBrowserAsync(paystackLink);
    console.log("Browser closed with result:", browserResult);

    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await verifyPayment(paymentReference);

    await AsyncStorage.removeItem('pendingBooking');
    setEditingRestoredBooking(false);

  } catch (err: any) {
    Alert.alert("Error", err.response?.data?.message || err.message || "Booking failed. Please try again.");
    setLoading(false);
  }
};

const verifyPayment = async (reference: string) => {
  const token = await getToken();
  console.log("Starting verification for reference:", reference);
  
  setIsVerifying(true);
  
  try {
    console.log("Verifying payment...");
    
    const verifyRes = await axios.get(
      `https://internsproject.vercel.app/api/bookings/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000,
      }
    );

    console.log("Full verification response:", JSON.stringify(verifyRes.data, null, 2));
    
    const verificationData = verifyRes.data?.data || verifyRes.data;
    const status = verificationData?.status || verificationData?.data?.status;
    const paymentStatus = verificationData?.paymentStatus || verificationData?.data?.paymentStatus;

    console.log("Status:", status, "PaymentStatus:", paymentStatus);

    if (
      status === "success" ||
      paymentStatus === "paid" ||
      status === "paid" ||
      paymentStatus === "success"
    ) {
      console.log("Payment verified successfully!");
      setIsVerifying(false);
      setShowSuccess(true);

      await AsyncStorage.removeItem("pendingBooking");
      return true;
    } else {
      setIsVerifying(false);
      setShowSuccess(true)
      return false;
    }

  } catch (err: any) {
    setIsVerifying(false);
    
    Alert.alert(
      "Verification Error",
      "Could not verify payment. Please check your bookings or contact support.",
      [
        {
          text: "Check Bookings",
          onPress: () => {
            router.push({
              pathname: "/(tabs)/MyBookings",
              params: { boatId }
            });
          }
        },
        {
          text: "OK",
          style: "cancel"
        }
      ]
    );
    return false;
  }
};

useEffect(() => {
  if (paymentReference) {
    console.log("=== PAYMENT DETAILS ===");
    console.log("Reference:", paymentReference);
    console.log("Verification URL:", `https://internsproject.vercel.app/api/bookings/verify/${paymentReference}`);
    console.log("======================");
  }
}, [paymentReference]);


    return(
        <>
      <ScrollView style={{backgroundColor: '#F8F8F8'}}>
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
                      <Text style={{fontSize: 16, marginBottom: 10,}}
                        onPress={() => router.navigate("/UserProfile")}
                      >
                        Profile
                      </Text>
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


        <View>
            <Text style={{fontFamily: 'Inter_400Regular', fontWeight: 700, fontSize:12, color: '#0A0A0A', lineHeight: 13.58,
                paddingHorizontal: 14, paddingVertical: 6.79,
            }}>
                Complete Your Booking
            </Text>

            {editingRestoredBooking && (
              <View style={{
                backgroundColor: '#EFF6FF',
                borderLeftWidth: 4,
                borderLeftColor: '#3B82F6',
                padding: 12,
                marginHorizontal: 14,
                marginVertical: 10,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10
              }}>
                <Ionicons name="information-circle" size={24} color="#3B82F6" />
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontFamily: 'Inter_600SemiBold',
                    fontSize: 14,
                    color: '#1E40AF',
                    marginBottom: 4
                  }}>
                    Booking Restored
                  </Text>
                  <Text style={{
                    fontFamily: 'Inter_400Regular',
                    fontSize: 12,
                    color: '#1E3A8A'
                  }}>
                    You can edit any details before completing your booking
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={async () => {
                    await AsyncStorage.removeItem('pendingBooking');
                    setEditingRestoredBooking(false);
                    router.replace('/(tabs)/HomePage');
                  }}
                >
                  <Ionicons name="close-circle" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
            )}

          <View style={{flexDirection:"row", alignItems: "center",justifyContent: "space-between"}}>
          <View style={styles.stepBox}>
            <View
            style={[
            styles.circle,
            step === 1 ? styles.activeCircle : styles.inactiveCircle
            ]}
            >
            <Text style={step === 1 ? styles.activeNumber : styles.inactiveNumber}> 1 </Text>
            </View>
            <Text style={step === 1 ? styles.activeLabel : styles. inactiveLabel}>
                        Date & Time
            </Text>
          </View>

          <View style={[styles.line, step >= 2 && styles.activeLine]} />

          <View style={styles.stepBox}>
            <View
            style={[
            styles.circle,
            step === 2 ? styles.activeCircle :styles.inactiveCircle
            ]}
            >
            <Text style={step === 2 ? styles.activeNumber : styles.inactiveNumber}> 2 </Text>
            </View>
            <Text style={[step === 2 ? styles.activeLabel : styles. inactiveLabel]}>
                      Trip Details
            </Text>
          </View>

          <View style={[styles.line, step >= 3 && styles.activeLine]} />

          <View style={styles.stepBox}>
            <View
            style={[
            styles.circle,
            step === 3 ? styles.activeCircle : styles.inactiveCircle
            ]}
            >
            <Text style={step === 3 ? styles.activeNumber : styles.inactiveNumber}> 3 </Text>
            </View>
            <Text style={step === 3 ? styles.activeLabel : styles. inactiveLabel}>
                      Payment
            </Text>
          </View>
        </View>

      <View>
        {step ===1 && 
        <View>
          <View style={styles.form}>
            <Text style={styles.label}> Full Name </Text>
            <TextInput
            placeholder="Enter your full name"
            placeholderTextColor='#787878'
            style={styles.input}
            // value={fullName}
            onChangeText={setFullName}
            returnKeyType="next"
            onSubmitEditing={() => emailRef.current ?.focus()}
            />
            <Text style={styles.label}>Email address</Text>
            <TextInput
            
            placeholder="example@gmail.com"
            placeholderTextColor='#787878'
            keyboardType="email-address"
            style={styles.input}
            value={email}
            editable={false}
            returnKeyType="next"
            />
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
            placeholder="Enter your phone number"
            placeholderTextColor='#787878'
            keyboardType="phone-pad"
            style={styles.input}
            value={phone}
            editable={false}
            returnKeyType="next"
            ref={phoneRef}
            />
            <Text style={[styles.label, { marginBottom: 4 }]}>
              Date & Time
            </Text>

            <Calendar
              style={{ marginTop: 0 }}
              minDate={new Date().toISOString().split("T")[0]}
              onDayPress={(day) => setSelectedDate(day.dateString)}
              markedDates={
                selectedDate
                  ? { [selectedDate]: { selected: true } }
                  : {}
              }
            />

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 6,
                zIndex: 10,
              }}
            >
              <View style={{ flex: 1, zIndex: 20 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: "#f5f5f5",
                    padding: 12,
                    borderRadius: 8,
                    marginVertical: 6,
                  }}
                  onPress={() => {
                    setShowEndDropdown(false);
                    setShowStartDropdown((p) => !p);
                  }}
                >
                  <Text>
                    Start Time:{" "}
                    {startTime.toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </TouchableOpacity>

                {showStartDropdown && (
                  <View
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: "#ddd",
                      maxHeight: 200,
                      zIndex: 30,
                      elevation: 15,
                    }}
                  >
                    <ScrollView nestedScrollEnabled>
                    {timeSlots
                      .filter((t) => Number(t.split(":")[0]) >= 8)
                      .map((t) => {
                        const [h, m] = t.split(":").map(Number);
                        const candidate = new Date(startTime);
                        candidate.setHours(h, m || 0, 0, 0);

                        return (
                          <TouchableOpacity
                            key={t}
                            style={[
                              styles.dropdownItem,
                            ]}
                            onPress={() => {
                              setStartTime(candidate);
                              setEndTime(new Date(candidate));
                              setShowStartDropdown(false);
                            }}
                          >
                            <Text>
                              {t}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>

              <Text style={{ marginHorizontal: 8 }}>–</Text>

              <View style={{ flex: 1, zIndex: 20 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: "#f5f5f5",
                    padding: 12,
                    borderRadius: 8,
                    marginVertical: 6,
                  }}
                  onPress={() => {
                    setShowStartDropdown(false);
                    setShowEndDropdown((p) => !p);
                  }}
                >
                  <Text>
                    End Time:{" "}
                    {endTime.toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </TouchableOpacity>

                {showEndDropdown && (
                  <View
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: "#ddd",
                      maxHeight: 200,
                      zIndex: 30,
                      elevation: 15,
                    }}
                  >
                    <ScrollView nestedScrollEnabled>
                      {timeSlots
                        .map((t) => {
                          const [h, m] = t.split(":").map(Number);
                          const d = new Date(startTime);
                          d.setHours(h, m || 0, 0, 0);
                          return d;
                        })
                        .filter((d) => d > startTime)
                        .map((candidate, idx) => {

                          return (
                            <TouchableOpacity
                              key={idx}
                              style={[
                                styles.dropdownItem,
                              ]}
                              onPress={() => {
                                setEndTime(candidate);
                                setShowEndDropdown(false);
                              }}
                            >
                              <Text>
                                {candidate.toLocaleTimeString("en-GB", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          </View>

            <View style={{marginVertical: 11.32, paddingHorizontal: 10, backgroundColor: 'white', borderRadius: 11.69,
              marginHorizontal: 14, paddingVertical: 11.32, justifyContent: 'center'
              }}>
              <Text style={{fontFamily: 'Inter_400Regular', fontSize: 14, color: "#0A0A0A"}}>
                Booking Summary
              </Text>

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

              <Text style={{fontFamily: 'Inter_600SemiBold', fontSize: 11.37, fontWeight: 600, marginTop: 5, marginBottom: 25}}>
                {boat?.boatName}
              </Text>

              <View>
                <View style={styles.info}>
                  <Text style={styles.footerLabel}> Full name</Text>
                  <Text style={styles.footerText}> {fullName}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.footerLabel}> Email address</Text>
                  <Text style={styles.footerText}> {email}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.footerLabel}> Phone number</Text>
                  <Text style={styles.footerText}> {phone}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.footerLabel}> Time</Text>
                  <Text style={styles.footerText}>
                    {startTime.toLocaleTimeString([], {hour: "2-digit", hour12: true,})} {"-"}
                    {endTime.toLocaleTimeString([], {hour: "2-digit", hour12: true,})}
                  </Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.footerLabel}> Duration</Text>
                  <Text>
                    {duration}
                  </Text>

                </View>
                <View style={styles.info}>
                  <Text style={styles.footerLabel}> Date </Text>
                  <Text style={styles.footerText}> {selectedDate}</Text>
                </View>

                <View style={[styles.info, {paddingTop: 15, borderBottomWidth: 1,borderColor: "#0000001A", borderTopWidth: 1
                    }]}>
                  <Text style={styles.footerLabel}>₦{pricePerHour.toLocaleString()} × {duration} hour</Text>
                  <Text style={styles.footerText}>₦{totalAmount.toLocaleString()}</Text>
                </View>
                <View style={{flexDirection: 'row', justifyContent: 'space-between',alignItems: 'center',paddingTop: 29.06,}}>
                  <Text style={{fontSize: 16, fontFamily: 'Inter_400Regular', fontWeight: 400,}}>Total</Text>
                  <Text style={{fontSize: 16, fontFamily: 'Inter_400Regular', fontWeight: 400,}}>
                    ₦{totalAmount.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity onPress={goNext}
              style={{backgroundColor: '#1A1A1A', borderRadius: 28.3, padding: 16, marginBottom: 50, marginHorizontal: 14,
                marginTop: 20
              }}
            >
              <Text style={{fontFamily: 'Inter_500Medium', fontWeight: 500, fontSize:12, color: 'white', lineHeight: 11.32, textAlign:"center"}}>
                Continue
              </Text>
            </TouchableOpacity>
          </View>}

          {step === 2 && 
          <View>
            <View style={{marginVertical: 11.32, paddingHorizontal: 10, backgroundColor: 'white', borderRadius: 11.69,
              marginHorizontal: 14, paddingVertical: 11.32, justifyContent: 'center'
            }}>
              <Text style={styles.label}>Number of Guest</Text>
              <TextInput
                keyboardType="number-pad"
                placeholder="0"
                value={guest.toString()}
                style={styles.input}
                onChangeText={(value: string) => {
                  const num = Number(value);

                  if (isNaN(num)) {
                    setGuest(1);
                    return;
                  }

                  if (num < 1) {
                    setGuest(0);
                  } else if (num > 40) {
                    setGuest(40);
                  } else {
                    setGuest(num);
                  }
                }}
              />
                <Text style={{fontSize: 10, fontFamily: 'Inter_400Regular', fontWeight: 400,}}>Maximum capacity: 40</Text>

                <Text style={styles.label}>Occasion</Text>

                <TouchableOpacity
                style={[
                  styles.input,
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  },
                ]}
                onPress={openOccassionMenu}
              >
                <Text>{occasion || 'Select occasion'}</Text>
                <Ionicons name="chevron-down" size={16} color="#888" />
              </TouchableOpacity>

              {occasionMenu && (
                <Animated.View
                  style={[
                    styles.dropdown,
                    {
                      transform: [{ translateY: dropAnim }],
                    },
                  ]}
                >
                  {occasionOpt.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setOccassion(item);
                        closeOccassionMenu();
                      }}
                    >
                      <Text>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </Animated.View>
              )}

              <Text style={styles.label}>Special Request (optional)</Text>
                  <TextInput
                    placeholder="Any special request or requirement"
                    style={[styles.input, {height: 67.69}]}
                    
                  />
            </View>

            <View style={{marginVertical: 11.32, paddingHorizontal: 10, backgroundColor: 'white', borderRadius: 11.69,
              marginHorizontal: 14, paddingVertical: 11.32, justifyContent: 'center',
            }}>
              <Text style={{fontFamily: 'Inter_400Regular', fontSize: 14, color: "#0A0A0A"}}>
                Booking Summary
              </Text>
              
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
              <Text style={{fontFamily: 'Inter_600SemiBold', fontSize: 11.37, fontWeight: 600, marginTop: 5, marginBottom: 25}}>
                {boat?.boatName}
              </Text>

              <View>
                <View style={styles.info}>
                  <Text style={styles.footerLabel}> Duration</Text>
                  <Text style={styles.footerText}> {duration} hours</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.footerLabel}> Date</Text>
                  <Text style={styles.footerText}> {selectedDate}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.footerLabel}> Time</Text>
                  <Text>
                    {startTime.toLocaleTimeString([], {hour: "2-digit", hour12: true,})} {"-"}
                    {endTime.toLocaleTimeString([], {hour: "2-digit", hour12: true,})}
                  </Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.footerLabel}> Guest</Text>
                  <Text style={styles.footerText}> {guest}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.footerLabel}> Occasion</Text>
                  <Text style={styles.footerText}> {occasion}</Text>
                </View>

                <View style={[styles.info, {paddingTop: 15, borderBottomWidth: 1,borderColor: "#0000001A", borderTopWidth: 1
                    }]}>
                  <Text style={styles.footerLabel}>₦{pricePerHour.toLocaleString()} × {duration} hour</Text>
                  <Text style={styles.footerText}>₦{totalAmount.toLocaleString()}</Text>
                </View>
                <View style={{flexDirection: 'row', justifyContent: 'space-between',alignItems: 'center',paddingTop: 29.06,}}>
                  <Text style={{fontSize: 16, fontFamily: 'Inter_400Regular', fontWeight: 400,}}>Total</Text>
                  <Text style={{fontSize: 16, fontFamily: 'Inter_400Regular', fontWeight: 400,}}>
                    ₦{totalAmount.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity onPress={goNext}
              style={{backgroundColor: '#1A1A1A', borderRadius: 28.3, padding: 16, marginHorizontal: 14,
                marginTop: 20
              }}
            >
              <Text style={{fontFamily: 'Inter_500Medium', fontWeight: 500, fontSize:12, color: 'white', lineHeight: 11.32, textAlign:"center"}}>
                Continue
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={goBack}
              style={{backgroundColor: '#1A1A1A', borderRadius: 28.3, padding: 16, marginBottom: 50, marginHorizontal: 14,
                marginTop: 5
              }}
            >
              <Text style={{fontFamily: 'Inter_500Medium', fontWeight: 500, fontSize:12, color: 'white', lineHeight: 11.32, textAlign:"center"}}>
                Back
              </Text>
            </TouchableOpacity>
            </View>}
          </View>

          <View>
            {step === 3 && 
            <View>
              <View>
                <View style={{marginVertical: 11.32, backgroundColor: 'white', borderRadius: 11.69,
                  marginHorizontal: 10, paddingVertical: 11.32, justifyContent: 'center', paddingHorizontal: 11.32
                  }}>
                <Text style={{fontFamily: 'Inter_400Regular', fontSize: 14, color: "#0A0A0A"}}>
                  Booking Summary
                </Text>
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
                <Text style={{fontFamily: 'Inter_600SemiBold', fontSize: 11.37, fontWeight: 600, marginTop: 5, marginBottom: 25}}>
                  {boat?.boatName}
                </Text>

                <View>
                  <View style={styles.info}>
                    <Text style={styles.footerLabel}> Duration</Text>
                    <Text style={styles.footerText}> {duration} hours</Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.footerLabel}> Date</Text>
                    <Text style={styles.footerText}> {selectedDate}</Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.footerLabel}> Time</Text>
                    <Text>
                      {startTime.toLocaleTimeString([], {hour: "2-digit", hour12: true,})} {"-"}
                      {endTime.toLocaleTimeString([], {hour: "2-digit", hour12: true,})}
                    </Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.footerLabel}> Guest</Text>
                    <Text style={styles.footerText}> {guest}</Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.footerLabel}> Occassion</Text>
                    <Text style={styles.footerText}> {occasion}</Text>
                  </View>

                  <View style={[styles.info, {paddingTop: 15, borderBottomWidth: 1,borderColor: "#0000001A", borderTopWidth: 1
                      }]}>
                    <Text style={styles.footerLabel}>₦{pricePerHour.toLocaleString()} × {duration} hour</Text>
                    <Text style={styles.footerText}>₦{totalAmount.toLocaleString()}</Text>
                  </View>
                  <View style={{flexDirection: 'row', justifyContent: 'space-between',alignItems: 'center',paddingTop: 29.06,}}>
                    <Text style={{fontSize: 16, fontFamily: 'Inter_400Regular', fontWeight: 400,}}>Total</Text>
                    <Text style={{fontSize: 16, fontFamily: 'Inter_400Regular', fontWeight: 400,}}>₦{totalAmount.toLocaleString()}</Text>
                  </View>
                </View>
            </View>

            <View style={{marginVertical: 11.32, backgroundColor: 'white', borderRadius: 11.69,
                  marginHorizontal: 10, paddingVertical: 11.32, justifyContent: 'center', paddingHorizontal: 11.32
                  }}>
              <View>
                <Text style={{fontFamily: 'Inter_600SemiBold', fontSize: 16, fontWeight: 600, marginVertical: 10}}>
                  Complete Payment
                </Text>
                <Text>You will be redirected to Paystack to complete your payment securely. 
                  Paystack accepts card payments, bank transfers, and other payment methods.
                </Text>

                <View style={{backgroundColor: '#F0FDF4', flexDirection: 'row', padding:10, alignItems: 'center',
                  borderRadius: 6,borderColor: "#125526ff", borderWidth: 1, gap:10,marginVertical: 12
                }}>
                  <MaterialIcons name="lock-outline" size={24} color="#125526ff"/>
                  <Text style={{paddingRight:60}}>
                    Your payment is secured by Paystack. We never store your card details.
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ flex: 1 }}>

            {!paystackUrl && !showSuccess && (
              <>
              <TouchableOpacity
                onPress={createBooking}
                style={{backgroundColor: '#1A1A1A', borderRadius: 28.3, padding: 16, marginHorizontal: 14,
                marginTop: 20
              }}
              >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff"/>
                  ) : (
                    <Text style={{fontFamily: 'Inter_500Medium', fontWeight: 500, fontSize:12, color: 'white', textAlign:"center"}}>
                      Proceed to Payment
                    </Text>
                  )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={goBack}
                style={{backgroundColor: '#1A1A1A', borderRadius: 28.3, padding: 16, marginBottom: 50, marginHorizontal: 14,
                marginTop: 10
              }}
              >
                <Text style={{fontFamily: 'Inter_500Medium', fontWeight: 500, fontSize:12, color: 'white', lineHeight: 11.32, textAlign:"center"}}>
                  Back
                </Text>
              </TouchableOpacity>
              </>
            )}

            {paystackUrl && (
              <WebView
                ref={webViewRef}
                source={{ uri: paystackUrl }}
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
                onShouldStartLoadWithRequest={(request) => {
                  const { url } = request;
                  if (url.includes("callback") || url.includes("reference=")) {
                    setPaystackUrl(null); 
                    verifyPayment(extractReference(url));
                    return false;
                  }

                  return true;
                }}
                style={{ flex: 1 }}
              />
            )}

            {isVerifying && (
              <Modal isVisible={isVerifying}>
                <View style={styles.modalCard}>
                  <View style={{ alignItems: 'center', marginVertical: 20 }}>
                    <ActivityIndicator size="large" color="#1A1A1A" />
                    <Text style={{ 
                      marginTop: 16, 
                      fontSize: 16,
                      fontWeight: '600',
                      textAlign: 'center',
                      fontFamily: 'Inter_600SemiBold'
                    }}>
                      Verifying Payment
                    </Text>
                    <Text style={{ 
                      marginTop: 8,
                      fontSize: 14,
                      color: '#666', 
                      textAlign: 'center',
                      fontFamily: 'Inter_400Regular' 
                    }}>
                      Please wait while we confirm your payment...
                    </Text>
                  </View>
                </View>
              </Modal>
            )}

            {showSuccess && paymentReference && (
              <Modal isVisible={showSuccess}>
              <View style={styles.modalCard}>
                <View style={{ alignItems: "center" }}>
                  <Image source={require('@/assets/images/Clip.png')} width={161.86} height={195.38} />
                  <Image
                    source={require('@/assets/images/success-aaIiyEo0wd.png')}
                    width={143.12}
                    height={114.5}
                    style={{ position: 'absolute', bottom: 30, left: 5 }}
                  />
                </View>
                <Text style={{ fontSize: 16, fontWeight: "600", fontFamily: 'Inter_600SemiBold', textAlign:'center' }}>
                  Booking Confirmed
                </Text>
                <Text style={{ fontSize: 12, fontWeight: "400", fontFamily: 'Inter_400Regular', color: '#4A5565', textAlign:'center' }}>
                  Your booking has been confirmed and the operator has been notified.
                </Text>

                <View style={{ backgroundColor:'#F7F7F7', paddingHorizontal: 16.47, paddingVertical: 10.29, marginVertical:10, borderRadius:4.12 }}>
                  <View style={[styles.info, { paddingHorizontal: 8}]}>
                    <Text style={styles.footerLabel}> Booking ID:</Text>
                    <Text style={styles.footerText}> {paymentReference} </Text>
                  </View>
                  <View style={{borderBottomWidth: 1,borderColor: "#0000001A", paddingHorizontal: 28}}></View>
                  <View style={[styles.info, {paddingTop: 10}]}>
                    <Text style={styles.footerLabel}> Duration</Text>
                    <Text style={styles.footerText}> {duration} hours</Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.footerLabel}> Date</Text>
                    <Text style={styles.footerText}> {selectedDate}</Text>
                  </View>
                  <View style={[styles.info, {borderBottomWidth: 1,borderColor: "#0000001A"}]}>
                    <Text style={styles.footerLabel}> Time</Text>
                    <Text>{startTime.toLocaleTimeString([], { hour: "2-digit", hour12: true })} - {endTime.toLocaleTimeString([], { hour: "2-digit", hour12: true })}</Text>
                  </View>
                </View>

                <Text style={{ textAlign:'center', fontSize: 12, fontWeight: "400", fontFamily: 'Inter_400Regular', color: '#4A5565', marginVertical: 5 }}>
                  A confirmation email has been sent to your email address with all booking details.
                </Text>

                <TouchableOpacity
                  onPress={() => router.navigate({
                    pathname: "/(tabs)/MyBookings",
                    params: {boatId: boatId}
                  })}
                  style={{ backgroundColor: '#1A1A1A', borderRadius: 26.16, padding: 15, marginBottom: 10, marginTop: 20 }}
                >
                  <Text style={{ fontFamily: 'Inter_500Medium', fontWeight: "500", fontSize:12, color: 'white', textAlign:"center" }}>View Booking</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setShowSuccess(false);
                    router.replace("/(tabs)/HomePage");
                  }}
                >
                  <Text style={{ textAlign:'center', fontFamily: 'Inter_500Medium', fontWeight: "500", fontSize:12 }}>Go back to Home</Text>
                </TouchableOpacity>
              </View>
              </Modal>
            )}
                  </View>
                </View>
            </View>}
          </View>
        </View>
      </ScrollView>
      </>
    )
}


const styles= StyleSheet.create({
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

    form:{
        paddingHorizontal: 20,
        backgroundColor: 'white', 
        borderRadius: 4.53, 
        marginHorizontal: 14,
        paddingVertical: 6.79,
        paddingBottom: 20,
        marginTop: 20
    },

    label:{
        color: '#0A0A0A', 
        fontSize: 12, 
        fontFamily: 'Inter_400Regular',
        lineHeight: 13.58,
        marginTop: 16,
        fontWeight: 700,
    },

    input:{
        borderRadius: 4.53,
        gap: 174.9,
        padding: 6.79,
        borderWidth: 0.57,
        marginTop: 8,
        borderColor: '#CCCCCC'
    },

    container: {
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    flex: 1,
  },

  header: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 25,
  },

  stepBox: {
    paddingHorizontal: 14,
    alignItems: "center",
  },

  circle: {
    width: 20,
    height: 20,
    borderRadius: 50,
    padding: 1,
    backgroundColor: '#E5E7EB',
    justifyContent: "center",
    alignItems: "center"
  },

  activeCircle: {
    backgroundColor: "#1A1A1A",
    borderColor: "#1A1A1A",
    borderRadius: 50,
  },

  inactiveCircle: {
    borderColor: "#dcdcdc",
    backgroundColor: "#f3f3f3"
  },

  activeNumber: {
    color: "white",
    fontWeight: "bold"
  },

  inactiveNumber: {
    color: "#8c8c8c",
    fontWeight: "bold"
  },

  line: {
    height: 2,
    width: 123.96,
    flex: 1,
    backgroundColor: "#e6e6e6",
    marginHorizontal: 5
  },

  activeLine: {
    backgroundColor: "black"
  },

  activeLabel: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "500"
  },

  inactiveLabel: {
    marginTop: 10,
    fontSize: 12,
    color: "#8c8c8c"
  },

  info:{
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  footerLabel:{
    color: '#4A5565', 
    fontSize: 12, 
    fontFamily: 'Inter_400Regular',
    fontWeight: 400,
    paddingBottom: 12,
  },

  footerText:{
    color: '#0A0A0A', 
    fontSize: 12, 
    fontFamily: 'Inter_500Medium',
    fontWeight: 500,
    paddingBottom: 12,
  },

  payment:{
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth:0.56,
    borderColor: '#CCCCCC',
    padding: 6.75,
    borderRadius:4.5,
  },
  
  paymentHeader: {
    color: '#1A1A1A', 
    fontSize: 14, 
    fontFamily: 'Inter_400Regular',
    fontWeight: 400,
  },
  paymentSubText: {
    color: '#A8A8AA', 
    fontSize: 12, 
    fontFamily: 'Inter_400Regular',
    fontWeight: 400,
  },
  paymentText: {
    color: '#1A1A1A', 
    fontSize: 14, 
    fontFamily: 'Inter_400Regular',
    fontWeight: 400,
    marginTop: 20
  },

  check: {
    width: 24,
    height: 24,
    borderRadius: 20,
    borderWidth: 2,
  },

  activeCheck: {
    backgroundColor: '#1A1A1A',
    
  },

  activate: {
    borderColor: '#1A1A1A'
  },

  modalCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
  },

  primaryBtn: {
    backgroundColor: "#000",
    padding: 12,
    borderRadius: 25,
    width: "100%",
    marginTop: 12,
    alignItems: "center",
  },

  dropdown: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 5,
    overflow: 'hidden',
    zIndex: 100,
    paddingVertical: 5,
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
})