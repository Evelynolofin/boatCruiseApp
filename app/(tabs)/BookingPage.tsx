import { httpClient } from "@/constants/httpClient";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useRef, useState, useEffect } from "react";
import {
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

type UserParams ={
  email?: string,
}

type Media = {
  url: string;
};

type Boat = {
  _id: string;
  pricePerHour: number;
  capacity: number;
  location: string;
  reviews: number;
  imageUrl: string;
  boatType: string;
  boatName: string;
  companyName: string;
  image: string;
  media?: Media[];
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
    const [bookingRef, setBookingRef] = useState<string | null>(null);
    const { boatId } = useLocalSearchParams<{ boatId: string }>();

    const [boat, setBoat] = useState<Boat | null>(null);


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

    const user ={
      email: params.email ?? "",
    }

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


    const timeSlots = generateHourSlots();
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date());
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showStartDropdown, setShowStartDropdown] = useState(false);
    const [showEndDropdown, setShowEndDropdown] = useState(false);

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
            console.log("boatId param:", boatId);
            console.log("using id:", id);

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

    
    const goToBookingDetails = () => {
    router.push({
      pathname: "/(tabs)/BookingDetails",
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
      },
    });
};

    const mainBoatImage = useMemo(() => {
      if (Array.isArray(boat?.media) && boat.media.length > 0) {
        return boat.media[0].url;
      }
      return null;
    }, [boat]);



  const createBooking = () => {
  if (!selectedDate) return Alert.alert("Error", "Select a date");
  console.log('I AM HERE 1')
  if (endTime <= startTime)
    return Alert.alert("Error", "End time must be after start time");
  console.log('I AM HERE 2')
  if (!occasion) return Alert.alert("Error", "Select occasion");
    console.log('I AM HERE 3')
  setLoading(true);

  console.log('I AM HERE 4')
   httpClient
    .post("/bookings/initialize", {
      boatId: boatId || BOAT_ID,
      startDate: buildISODateTime(selectedDate, startTime),
      endDate: buildISODateTime(selectedDate, endTime),
      numberOfGuest: guest,
      occasion,
      specialRequest,
    })
    
    .then((res) => {
      setBookingRef(
        res.data?.bookingReference ||
        res.data?.data?.bookingReference ||
        ""
      );

      setPaystackUrl(
        res.data?.authorization_url ||
        res.data?.data?.authorization_url ||
        ""
      );
    })
    .catch((err: any) => {
      console.log(err)
      Alert.alert(
        "Error",
        err.response?.data?.message || "Booking failed"
      );
    })
    .finally(() => {
      setLoading(false);
    });
};



  const verifyPayment = async () => {
    if (!bookingRef) return;

    try {
      setLoading(true);
      console.log('I AM HERE 6')
      const res = await httpClient.get(
        `/bookings/verify/${bookingRef}`
      );
        console.log(res)

      if (res.data?.status === "success") {
        setShowSuccess(true);
      } else {
        Alert.alert("Payment not confirmed yet");
      }
    } catch (err: any) {
      console.log(err)
      Alert.alert(
        "Verification failed",
        err.response?.data?.message || "Unable to verify payment"
      );
    } finally {
      setLoading(false);
    }
  };

if (paystackUrl) {
  return (
    <WebView
      source={{ uri: paystackUrl }}
      startInLoadingState
      onNavigationStateChange={(nav) => {
        if (
          nav.url.includes("payment-success") &&
          bookingRef
        ) {
          setPaystackUrl(null);

          verifyPayment();
        }
      }}
    />
  );
}


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
    
                <View style={{paddingHorizontal: 10, paddingVertical: 20}}>
                    <TouchableOpacity 
                        style={{flexDirection: 'row', gap: 2, alignItems:'center'}}
                        
                        // onPress={() =>
                        //   router.push({
                        //     pathname:'/(tabs)/YachtDetails',
                        //     params:{ boatId: BOAT_ID },
                        //   })
                        // }
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
                {step ===1 && <View>
                    <View style={styles.form}>
                      <Text style={styles.label}> Full Name </Text>
                      <TextInput
                      placeholder="Enter your full name"
                      placeholderTextColor='#787878'
                      style={styles.input}
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
                      onChangeText={setEmail}
                      returnKeyType="next"
                      ref={emailRef}
                      onSubmitEditing={() => phoneRef.current ?.focus()}
                      />
                      <Text style={styles.label}>Phone Number</Text>
                      <TextInput
                      placeholder="Enter your phone number"
                      placeholderTextColor='#787878'
                      keyboardType="phone-pad"
                      style={styles.input}
                      onChangeText={setPhone}
                      returnKeyType="next"
                      ref={phoneRef}
                      />
                      <Text style={styles.label}>Date & Time</Text>
                      <TouchableOpacity onPress={openCalendar}
                        style={styles.input}
                      >
                        <Text>
                          Select Date
                        </Text>
                      </TouchableOpacity>

                      {calendarOpen && (
                        <>
                          <TouchableOpacity onPress={closeCalendar}>
                          <Animated.View
                            style={{transform: [{ translateY: slideAnim }]}}
                          >
                            <Calendar
                              minDate={new Date().toISOString().split("T")[0]}
                              onDayPress={(day) => setSelectedDate(day.dateString)}
                              markedDates={
                                selectedDate ? { [selectedDate]: { selected: true } } : {}
                              }
                            />

                          <View style={{flexDirection: 'row',alignItems:'center', justifyContent:'space-between'}}>
                            <View>
                              <TouchableOpacity
                                style={{backgroundColor: "#f5f5f5", padding: 14, borderRadius: 8, marginVertical: 12}}
                                onPress={() => setShowStartDropdown((p) => !p)}
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
                                <View style={{backgroundColor: "#fff", borderRadius: 8, borderWidth: 1, 
                                  borderColor: "#ddd", marginBottom: 12}}
                                >
                                  <ScrollView style={{ maxHeight: 200 }}>
                                {timeSlots.map((t) => {
                                  const [h] = t.split(":").map(Number);
                                  const candidate = new Date(startTime);
                                  candidate.setHours(h, 0, 0, 0);
              
                                  const isPast =
                                    selectedDate === new Date().toISOString().split("T")[0] &&
                                    candidate < new Date();
              
                                  return (
                                  <TouchableOpacity
                                    key={t}
                                    disabled={isPast}
                                    style={[
                                      styles.dropdownItem,
                                      isPast && { opacity: 0.3 },
                                    ]}
                                    onPress={() => {
                                      setStartTime(candidate);
                                      setShowStartDropdown(false);
                                    }}
                                  >
                                    <Text>{t}</Text>
                                  </TouchableOpacity>
                                  );
                                })}
                                  </ScrollView>
                                </View>
                              )}
                            </View>

                            <Text>-</Text>
                            
                            <View>
                              <TouchableOpacity
                              onPress={() => setShowEndDropdown((p) => !p)}
                              style={{backgroundColor: "#f5f5f5", padding: 14, borderRadius: 8, marginVertical: 12}}
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
                              <View style={{backgroundColor: "#fff", borderRadius: 8, borderWidth: 1, 
                                borderColor: "#ddd", marginBottom: 12}}
                              >
                                <ScrollView style={{ maxHeight: 200 }}>
                                  {timeSlots.map((t) => {
                                    const [h] = t.split(":").map(Number);
                                    const candidate = new Date(startTime);
                                    candidate.setHours(h, 0, 0, 0);
                                    return candidate;
                                  })
                                  .filter((candidate) => candidate > startTime)
                                  .map((candidate, idx) => {
                                    const t = candidate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
                                    const isPast = selectedDate === new Date().toISOString().split("T")[0] && candidate < new Date();
                                    return (
                                      <TouchableOpacity
                                        key={idx}
                                        disabled={isPast}
                                        style={[styles.dropdownItem, isPast && { opacity: 0.3 }]}
                                        onPress={() => {
                                          setEndTime(candidate);
                                          setShowEndDropdown(false);
                                        }}
                                      >
                                        <Text>{t}</Text>
                                      </TouchableOpacity>
                                    );
                                  })}
                                </ScrollView>
                                  </View>
                                )}
                                </View>
                              </View>

                              <TouchableOpacity style={styles.primaryBtn} onPress={closeCalendar}>
                                <Text style={{ color: "white" }}>Done</Text>
                              </TouchableOpacity>
                            </Animated.View>
                          </TouchableOpacity>
                        </>
                      )}
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
                        The Serenity Yacht 
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
                          <Text style={styles.footerText}>₦{Number(boat?.pricePerHour ?? 0).toLocaleString()}</Text>
                        </View>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between',alignItems: 'center',paddingTop: 29.06,}}>
                          <Text style={{fontSize: 16, fontFamily: 'Inter_400Regular', fontWeight: 400,}}>Total</Text>
                          <Text style={{fontSize: 16, fontFamily: 'Inter_400Regular', fontWeight: 400,}}>₦{totalAmount.toLocaleString()}</Text>
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
                          } else if (num > 20) {
                            setGuest(20);
                          } else {
                            setGuest(num);
                          }
                        }}
                      />
                        <Text style={{fontSize: 10, fontFamily: 'Inter_400Regular', fontWeight: 400,}}>Maximum capacity: 20</Text>

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
                        The Serenity Yacht 
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
                          <Text style={styles.footerText}>₦{Number(boat?.pricePerHour ?? 0).toLocaleString()}</Text>
                        </View>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between',alignItems: 'center',paddingTop: 29.06,}}>
                          <Text style={{fontSize: 16, fontFamily: 'Inter_400Regular', fontWeight: 400,}}>Total</Text>
                          <Text style={{fontSize: 16, fontFamily: 'Inter_400Regular', fontWeight: 400,}}>₦{totalAmount.toLocaleString()}</Text>
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
                      <View
                      style={{marginVertical: 11.32, paddingHorizontal: 10, backgroundColor: 'white', borderRadius: 11.69,
                      marginHorizontal: 14, paddingVertical: 30, justifyContent: 'center'
                      }}
                      >
                        <Text style={{fontFamily: 'Inter_500Medium', fontWeight: 500, fontSize:14, color: '#0A0A0A', lineHeight: 13.51}}>
                          Payment Details
                        </Text>
                        <Text style={{fontSize: 12, color: '#0A0A0A', fontFamily: 'Inter_400Regular', fontWeight: 400, paddingTop: 16, paddingBottom: 8}}>
                          Select payment method
                        </Text>

                        <Text style={{}}>
                          Total: ₦{totalAmount.toLocaleString()}
                        </Text>

                        <TouchableOpacity
                          style={{}}
                          disabled={loading}
                          onPress={createBooking}
                        >
                          <Text style={{}}>
                            {loading ? "Processing..." : "Pay with Paystack"}
                          </Text>
                        </TouchableOpacity>
                        
                      </View>

                      {/* <View
                      style={{marginVertical: 11.32, paddingHorizontal: 10, backgroundColor: 'white', borderRadius: 11.69,
                      marginHorizontal: 14, paddingVertical: 30, justifyContent: 'center'
                      }}
                      >
                        <Text style={{fontFamily: 'Inter_500Medium', fontWeight: 500, fontSize:14, color: '#0A0A0A', lineHeight: 13.51}}>
                          Payment Details
                        </Text>
                        <Text style={{fontSize: 12, color: '#0A0A0A', fontFamily: 'Inter_400Regular', fontWeight: 400, paddingTop: 16, paddingBottom: 8}}>
                          Select payment method
                        </Text>

                        <View style={{gap: 20}}>
                          <TouchableOpacity
                          style={[styles.payment, method ===  "card" && styles.activate]}
                          onPress={() => setMethod(method === 'card' ? null : 'card')}
                          >
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap:6}}>
                              <Ionicons name="card-outline" size={20} />
                              <View>
                                <Text style={styles.paymentHeader}>Credit/Debit Card</Text>
                                <Text style={styles.paymentSubText}>Instant confirmation</Text>
                              </View>
                            </View>

                            <View style={[styles.check, method === "card" && styles.activeCheck]} />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.payment, method ===  "bank" && styles.activate]}
                            onPress={() => setMethod(method === 'bank' ? null : 'bank')}
                          >
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap:6}}>
                              <Ionicons name="cash-outline" size={20} />
                              <View>
                                <Text style={styles.paymentHeader}>Bank Transfer</Text>
                                <Text style={styles.paymentSubText}>Manual verification required</Text>
                              </View>
                            </View>

                            <View style={[styles.check, method === "bank" && styles.activeCheck]} />
                          </TouchableOpacity>
                        </View>

                        {method === 'card' && (
                          <View>
                            <Text style={styles.paymentText}>Card Number</Text>
                            <TextInput
                              placeholder="1234 5678 9012 3456"
                              keyboardType="numeric"
                              style={styles.input}
                            />

                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',}}>
                              <View>
                                <Text style={styles.paymentText}>Expiry Date</Text>
                                <TextInput
                                  placeholder="MM/YY"
                                  keyboardType="numeric"
                                  style={[styles.input, {width: 150}]}
                                />
                              </View>
                              <View>
                                <Text style={styles.paymentText}>CVV</Text>
                                <TextInput
                                  placeholder="123"
                                  keyboardType="numeric"
                                  secureTextEntry
                                  style={[styles.input, {width: 150}]}
                                />
                              </View>
                            </View>
                          </View>
                        )}

                        {method === 'bank' && (
                          <View>
                            <Text style={styles.paymentText}>Account Name</Text>
                            <TextInput
                              placeholder="Olofin Evelyn"
                              keyboardType="default"
                              style={styles.input}
                            />

                            <View>
                              <Text style={styles.paymentText}>Account Number</Text>
                              <TextInput
                                placeholder="1234567890"
                                keyboardType="numeric"
                                style={styles.input}
                              />
                              <Text style={styles.paymentText}>Bank Name</Text>
                              <TextInput
                                placeholder="Bank"
                                keyboardType="default"
                                style={styles.input}
                              />
                            </View>
                          </View>
                        )}
                      </View> */}

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
                          The Serenity Yacht 
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
                            <Text style={styles.footerText}>₦{Number(boat?.pricePerHour ?? 0).toLocaleString()}</Text>
                          </View>
                          <View style={{flexDirection: 'row', justifyContent: 'space-between',alignItems: 'center',paddingTop: 29.06,}}>
                            <Text style={{fontSize: 16, fontFamily: 'Inter_400Regular', fontWeight: 400,}}>Total</Text>
                            <Text style={{fontSize: 16, fontFamily: 'Inter_400Regular', fontWeight: 400,}}>₦{totalAmount.toLocaleString()}</Text>
                          </View>
                        </View>
                    </View>

                    <TouchableOpacity 
                    onPress={createBooking}
                      style={{backgroundColor: '#1A1A1A', borderRadius: 28.3, padding:16, marginHorizontal: 14,
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
                      </View>
                    </View>}

                    <Modal isVisible={showSuccess}>
                      <View style={styles.modalCard}>
                        <View style={{alignItems: "center",}}>
                          <Image
                            source={require('@/assets/images/Clip.png')}
                            width={161.86}
                            height={195.38}
                          />
                          <Image
                            source={require('@/assets/images/success-aaIiyEo0wd.png')}
                            width={143.12}
                            height={114.5}
                            style={{position: 'absolute', bottom: 30, left: 5}}
                          />
                        </View>
                        <Text style={{fontSize: 16, fontWeight: "600", fontFamily: 'Inter_600SemiBold', textAlign:'center'}}>
                          Booking Confirmed
                        </Text>
                        <Text style={{fontSize: 12, fontWeight: "400", fontFamily: 'Inter_400Regular', color: '#4A5565', textAlign:'center'}}>
                          Your booking has been confirmed and the operator has been notified.
                        </Text>

                        <View style={{backgroundColor:'#F7F7F7', paddingHorizontal: 16.47, paddingVertical: 10.29, marginVertical:10,
                          borderRadius:4.12
                        }}>
                          <View style={[styles.info, { paddingHorizontal: 8}]}>
                          <Text style={styles.footerLabel}> Booking ID:</Text>
                          <Text style={styles.footerText}> {bookingRef ?? "—"} </Text>
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
                          <Text>
                            {startTime.toLocaleTimeString([], {hour: "2-digit", hour12: true,})} {"-"}
                            {endTime.toLocaleTimeString([], {hour: "2-digit", hour12: true,})}
                          </Text>
                          </View>
                        </View>

                        <View>
                          <Text style={{textAlign:'center', fontSize: 12, fontWeight: "400", fontFamily: 'Inter_400Regular', color: '#4A5565',}}>
                            A confirmation email has been sent to your email address with all 
                            the booking details and directions to the pickup location.
                          </Text>
                        </View>

                        <TouchableOpacity
                        onPress={goToBookingDetails}
                          style={{backgroundColor: '#1A1A1A', borderRadius: 26.16, padding: 15, marginBottom: 10,
                            marginTop: 20,
                          }}
                        >
                          <Text style={{fontFamily: 'Inter_500Medium', fontWeight: 500, fontSize:12, color: 'white', textAlign:"center"}}>
                            View Booking
                          </Text>
                        </TouchableOpacity>
              
                        <TouchableOpacity
                          onPress={() => {
                            setShowSuccess(false);
                            router.replace("/(tabs)/HomePage");
                          }}
                        >
                          <Text style={{textAlign:'center', fontFamily: 'Inter_500Medium', fontWeight: 500, fontSize:12}}>Go back to Home</Text>
                        </TouchableOpacity>
                      </View>
                    </Modal>
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

