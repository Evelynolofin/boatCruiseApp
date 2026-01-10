import {
  ScrollView,
  Text,
  Image,
  View,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useState, useRef, useEffect, useCallback } from "react";
import Modal from "react-native-modal";
import { router, useLocalSearchParams } from "expo-router";
import { httpClient } from "@/constants/httpClient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { removeToken } from "@/constants/tokenFile";

const SCREEN_WIDTH = Dimensions.get("window").width;
const PANEL_WIDTH = SCREEN_WIDTH * 0.4;
const STATUS_BAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight || 0 : 44; 

type MediaItem = {
  url: string;
  type: string;
};

type Boat = {
  _id: string;
  boatName: string;
  boatType: string;
  description: string;
  location: string;
  pricePerHour: number;
  amenities: string | string[];
  media: MediaItem[];
};

export default function YachtDetails() {
  const { boatId } = useLocalSearchParams<{ boatId: string }>();

  const [boat, setBoat] = useState<Boat | null>(null);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState(false);
  const [profile, setProfile] = useState(false);
  const [galleryVisible, setGalleryVisible] = useState(false);
  const [open, setOpen] = useState (false)
  const [refreshing, setRefreshing] = useState(false);

  const slideAnim = useRef(new Animated.Value(PANEL_WIDTH)).current;

  const openPanel = () => {
    setProfile(true);
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

  const fetchBoat = useCallback(async () => {
    if (!boatId) return;
    
    try {
      const res = await httpClient.get(`/boats/${boatId}`);
      setBoat(res.data.data);
    } catch (e) {
      console.error("Failed to load boat", e);
    } finally {
      setLoading(false);
    }
  }, [boatId]);

  useEffect(() => {
    fetchBoat();
  }, [fetchBoat]);

  const refreshBookings = async () => {
    setRefreshing(true);
    await fetchBoat();
    setRefreshing(false);
  };

  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 120 }} />;
  }

  if (!boat) {
    return <Text style={{ padding: 20 }}>Boat not found</Text>;
  }

  const mediaUrls = Array.isArray(boat.media)
    ? boat.media.map(item => item.url)
    : [];

  const previewImages = mediaUrls.slice(0, 4);

  const amenities =
    Array.isArray(boat.amenities)
      ? boat.amenities
      : boat.amenities.split(",");

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

      <ScrollView style={{ backgroundColor: "#F8F8F8" }}
        bounces={true}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshBookings} />}
      >
          <View style={{paddingHorizontal: 10, paddingVertical: 20}}>
            <TouchableOpacity 
                style={{flexDirection: 'row', gap: 2, alignItems:'center'}}
                
                onPress={() =>
                  router.push({
                    pathname:'/(tabs)/FeaturedYacht',
                    params:{ boatId: boatId },
                  })
                }
            >
                <Ionicons
                name="arrow-back"
                size={18}
                color='#292D329E'
                />
                <Text style={{fontWeight:400, fontSize:14, color: '#292D329E'}}>Go back</Text>
            </TouchableOpacity>
        </View>

        <View style={{ padding: 16 }}>
          <Text style={styles.title}>{boat.boatName}</Text>
          <Text style={styles.subtitle}>⭐ 4.8 • {boat.location}</Text>
        </View>

        <View style={styles.imageGrid}>
          {previewImages.map((url, index) => {
            const isLast = index === 3 && mediaUrls.length > 4;

            return (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: url }} style={styles.image} />

                {isLast && (
                  <TouchableOpacity
                    style={styles.overlay}
                    onPress={() => setGalleryVisible(true)}
                  >
                    <Text style={styles.overlayText}>
                      +{mediaUrls.length - 4} more
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{boat.boatType}</Text>
          <Text style={styles.cardText}>{boat.description}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What is included</Text>

          <View style={styles.amenities}>
            {amenities.map((amenity: string, index: number) => (
                <View
                key={index}
                style={{ flexDirection: "row", alignItems: "center", gap: 8, width: "48%" }}
                >
                <Image
                    source={require('@/assets/images/captain.png')}
                    style={{ width: 20, height: 20 }}
                />
                <Text style={{ fontSize: 12, color: "#333" }}>
                    {amenity.trim()}
                </Text>
                </View>
            ))}
          </View>
        </View>
        
        <View style={{paddingHorizontal:16}}>
            <View style={{marginTop:8, backgroundColor: 'white', paddingHorizontal: 8, paddingVertical: 16, borderRadius: 4.6}}>
                <Text style={{fontFamily: 'Inter_500Medium', fontWeight: 500, fontSize:16, color: '#1A1A1A'}}>
                    Cancellation Policy
                </Text>
                <Text style={{fontFamily: 'Inter_500Medium', fontWeight: 500, fontSize:10, color: '#1A1A1A', lineHeight: 13.79, paddingTop: 5}}>
                    Grace Period: <Text style={{fontFamily: 'Inter_400Regular', fontWeight: 400, fontSize:9.19, lineHeight: 13.79, color: '#737373'}}>
                    You can cancel within 24 hours and get a full refund provided 
                    there's at least 72 hours before the charter start time
                </Text>
                </Text>
            </View>
        </View>

        <View style={{paddingHorizontal:16}}>
            <View style={{marginTop:8, backgroundColor: 'white', paddingHorizontal: 8, paddingVertical: 16, flexDirection:'row', borderRadius: 4.6, gap: 4.6, alignItems: 'center'}}>
                <Image
                source={require('@/assets/images/person.jpg')}
                style={{
                    width: 45.96,
                    height: 45.96,
                    borderRadius: 50
                }}
                />

                <View>
                    <Text style={{fontFamily: 'Inter_500Medium', fontWeight: 500, fontSize:12, color: '#1A1A1A'}}>
                        Hosted by captain Toyin
                    </Text>
                    <Text style={{fontFamily: 'Inter_400Regular', fontWeight: 400, fontSize:10, lineHeight: 13.79, color: '#737373'}}>
                        Joined, May 2024
                    </Text>
                    <Text style={{fontFamily: 'Inter_400Regular', fontWeight: 400, fontSize:10, lineHeight: 13.79, color: '#737373'}}>
                        ⭐ 4.8 Rating (52 operator reviews) 
                    </Text>
                </View>
            </View>

            <View>
                <View style={{marginTop:8, backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 20, borderRadius: 4.6, gap: 4.6, marginBottom: 50}}>
                            <View style={{borderBottomColor: '#0000001A', borderBottomWidth: 1, paddingVertical: 16,}}>
                                <Text style={[styles.price,{fontFamily: 'Inter_400Regular', fontWeight: 400, fontSize:20, lineHeight: 13.79, 
                                    color: '#0A0A0A', paddingVertical: 6
                                }]}>                       
                                    ₦{boat.pricePerHour.toLocaleString()}
                                <Text style={{fontFamily: 'Inter_400Regular', fontWeight: 400, fontSize:10, lineHeight: 13.79, color: '#4A5565'}}>/hour</Text></Text>
                                <Text style={{fontFamily: 'Inter_400Regular', fontWeight: 400, fontSize:10, lineHeight: 13.79, color: '#6A7282'}}>Final price shown at checkout</Text>
                            </View>

                            <View style={{paddingVertical: 16}}>
                                <Text 
                                    style={{fontFamily: 'Inter_500Medium', fontWeight: 500, fontSize:24, color: '#0A0A0A', paddingVertical: 5}}
                                >
                                    Cruise Lagos Differently
                                </Text>
                                <Text 
                                    style={{fontFamily: 'Inter_400Regular', fontWeight: 400, fontSize:10, color: '#807E7E', paddingTop:10}}
                                >
                                    Birthdays, proposals, parties - all better on a boat. You book the boat and we bring the vibes!
                                </Text>
                            </View>

                            <TouchableOpacity
                            onPress={() =>
                                router.push({
                                    pathname: "/BookingPage",
                                    params: { boatId: boat._id },
                                })
                                }
                            style={{backgroundColor:'#1A1A1A', flexDirection:'row', justifyContent:'center',padding: 15, 
                                borderRadius: 31.76, gap: 5.08, alignItems: 'center'}}
                            >
                                <Feather name="calendar" size={12} color="white" />
                                <Text style={{fontFamily: 'Inter_500Medium', fontWeight: 500, fontSize:12, color: 'white', lineHeight: 12.7,}}>
                                    Book Now
                                </Text>
                            </TouchableOpacity>

                            <Text
                            style={{fontFamily: 'Inter_400Regular', fontWeight: 400, fontSize:10, color: '#6A7282', textAlign: 'center',
                                paddingBottom:16, borderBottomColor: '#0000001A', borderBottomWidth: 1}}
                            >
                                You won't be charged yet
                            </Text>

                        <View style={{width:228.76, gap: 5.08, paddingTop: 16}}>
                            <View style={{flexDirection:'row', justifyContent: 'space-between',}}>
                            <Text>Instant confirmation</Text>
                            <Ionicons name="checkmark" size={13} color="#00A63E" />
                            </View>
                            <View style={{flexDirection:'row', justifyContent: 'space-between',}}>
                                <Text>Verified operator</Text>
                                <Ionicons name="checkmark" size={13} color="#00A63E" />
                            </View>
                            <View style={{flexDirection:'row', justifyContent: 'space-between',}}>
                                <Text>24h cancellation policy</Text>
                                <Ionicons name="checkmark" size={13} color="#00A63E" />
                            </View>
                        </View>
                     </View>
            </View>
        </View>
      </ScrollView>

      <Modal
        isVisible={galleryVisible}
        onBackdropPress={() => setGalleryVisible(false)}
        style={{ margin: 0 }}
      >
        <View style={styles.galleryContainer}>
          <View style={styles.galleryHeader}>
            <Text style={styles.galleryTitle}>Photos</Text>
            <TouchableOpacity onPress={() => setGalleryVisible(false)}>
              <Ionicons name="close" size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.galleryGrid}>
            {mediaUrls.map((url, index) => (
              <Image
                key={index}
                source={{ uri: url }}
                style={styles.galleryImage}
              />
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  navBar: {
    height: 50 + STATUS_BAR_HEIGHT,
    paddingTop: STATUS_BAR_HEIGHT,
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  logoText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },

  title: {
    fontSize: 26,
    fontWeight: "600",
  },

  subtitle: {
    color: "#777",
    marginTop: 4,
  },

  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 16,
  },

  imageWrapper: {
    width: "48%",
    height: 160,
  },

  image: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },

  overlay: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.6)",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },

  overlayText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },

  card: {
    backgroundColor: "white",
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },

  cardText: {
    color: "#555",
  },

  amenities: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  amenity: {
    width: "48%",
  },

  amenityText: {
    fontSize: 13,
  },

  price: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },

  bookBtn: {
    backgroundColor: "#1A1A1A",
    padding: 12,
    borderRadius: 24,
    alignItems: "center",
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

  galleryContainer: {
    flex: 1,
    backgroundColor: "white",
    paddingTop: 40,
  },

  galleryHeader: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },

  galleryTitle: {
    fontSize: 18,
    fontWeight: "600",
  },

  galleryGrid: {
    padding: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  galleryImage: {
    width: "48%",
    height: 180,
    borderRadius: 8,
  },
});