import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  ScrollView,
  Text,
  Image,
  View,
  StatusBar,
  Dimensions,
  Animated,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import Modal from "react-native-modal";
import { router } from "expo-router";
import { httpClient } from "@/constants/httpClient";

const SCREEN_WIDTH = Dimensions.get("window").width;
const PANEL_WIDTH = SCREEN_WIDTH * 0.4;
const PANEL_HEIGHT = 280;

type Boat = {
  _id: string;
  name: string;
  pricePerHour: number;
  capacity: number;
  location: string;
  rating: number;
  reviews: number;
  imageUrl: string;
  boatType: string;
  boatName: string;
  companyName: string;
  description: string;
  amenities: string;
  media: string;
  images: string
};

export default function FeaturedYachts() {
const [open, setOpen] = useState (false)

  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({});
    const [menuVisible, setMenuVisible] = useState<Record<string, boolean>>({});
    const options = ['Low Price', 'High Price'];

    const openMenu = (key: string) => setMenuVisible({ ...menuVisible, [key]: true });
    const closeMenu = (key: string) => setMenuVisible({ ...menuVisible, [key]: false });

    const handleSelect = (key: string, value: string) => {
        setSelectedValues({ ...selectedValues, [key]: value });
        closeMenu(key);
    };

    const [profile, setProfile] = useState(false);
    const [boats, setBoats] = useState<Boat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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
      const [activeFilter, setActiveFilter] = useState<string | null>(null);

      const openDropdown = (key: string) => {
      setActiveFilter(key);
        slideAnim.setValue(PANEL_HEIGHT);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
      };

      const closeAllPanels = () => {
        Animated.timing(slideAnim, {
          toValue: PANEL_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          setProfile(false);
          setActiveFilter(null);
        });
      };

      useEffect(() => {
          const fetchBoats = async () => {
            try {
              setLoading(true);
              setError(null);
      
              const res = await httpClient.get("/boats");
      
              // console.log({response: res.data.data})
              if (Array.isArray(res.data.data)) {
                setBoats(res.data.data);
              } else {
                console.log("Unexpected API response format.")
                setError("Unexpected API response format.");
              }
            } catch (e) {
              console.error("Failed to load boats", e);
              setError("Failed to load boats");
            } finally {
              setLoading(false);
            }
          };
      
          fetchBoats();
        }, []);
      

  const filterDefs = [
    {
      key: "capacity",
      type: "dropdown",
      label: "Capacity",
      options: ["All","up to 12", "13-20", "21-30", "30+"],
    },
    { key: "minprice", type: "input", label: "Min price" },
    { key: "maxprice", type: "input", label: "Max price" },
    {
      key: "price",
      type: "dropdown",
      label: "Price",
      options: ["Low to High", "High to Low"],
    },
  ];

  const filteredBoats = useMemo(() => {
      let result = [...boats];
  
      if (selectedValues.capacity && selectedValues.capacity !== "All") {
    switch (selectedValues.capacity) {
      case "up to 12":
        result = result.filter((b) => b.capacity <= 12);
        break;

      case "13-20":
        result = result.filter(
          (b) => b.capacity >= 13 && b.capacity <= 20
        );
        break;

      case "21-30":
        result = result.filter(
          (b) => b.capacity >= 21 && b.capacity <= 30
        );
        break;

      case "30+":
        result = result.filter((b) => b.capacity > 30);
        break;
    }
  }
  
      if (selectedValues.minprice) {
        result = result.filter((b) => b.pricePerHour >= Number(selectedValues.minprice));
      }
  
      if (selectedValues.maxprice) {
        result = result.filter((b) => b.pricePerHour <= Number(selectedValues.maxprice));
      }
  
      if (selectedValues.price === "Low to High") result.sort((a, b) => a.pricePerHour - b.pricePerHour);
      if (selectedValues.price === "High to Low") result.sort((a, b) => b.pricePerHour - a.pricePerHour);
  
      return result;
    }, [boats, selectedValues]);
  
    const goToBooking = (boat: Boat) =>{
      router.push({
        pathname: ("/(tabs)/BookingPage"),
          params: {
            boatId: boat._id,
          pricePerHour: String(boat.pricePerHour),
          boatName: boat.name,
          }
      })
    }

    const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

const viewDetails = async (boatId: string) => {
  try {
    setDetailsLoading(true);
    const res = await httpClient.get(`/boats/${boatId}`);
    // console.log({response: res.data.data})
    setSelectedBoat(res.data.data); 
  } catch (e) {
    console.error("Failed to load boat details", e);
    setSelectedBoat(null);
  } finally {
    setDetailsLoading(false);
  }
};

    

  return (
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
                              styles.slidePanel,
                              { transform: [{ translateX: slideAnim }] },
                            ]}
                            >
                                <Text style={{fontSize: 18, fontWeight: "bold", marginBottom: 20,}}>User Profile</Text>
                                {/* <Text style={{fontSize: 16, marginVertical: 10,}}>{email || "Guest User"}</Text> */}
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

        <View style={{paddingHorizontal: 10, paddingVertical: 20}}>
            <TouchableOpacity 
                style={{flexDirection: 'row', gap: 2, alignItems:'center'}}
                onPress={() => router.navigate('/(tabs)/HomePage')}
            >
                <Ionicons
                name="arrow-back"
                size={18}
                color='#292D329E'
                />
                <Text style={{fontWeight:400, fontSize:14, color: '#292D329E'}}>Go back</Text>
            </TouchableOpacity>
        </View>

          <View style={styles.filterRow}>
            {filterDefs.map((f) => (
              <View key={f.key} style={styles.filterBox}>
                {f.type === "dropdown" ? (
                  <TouchableOpacity
                    style={[
                      styles.dropdown, 
                      f.key === "price" ,
                      f.key === "capacity" && styles.capacityDropdown,
                      ]}
                    onPress={() => openDropdown(f.key)}
                  >
                    <Text style={styles.dropdownText}>
                      {selectedValues[f.key] ||f.label}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color="#555" />
                  </TouchableOpacity>
                ) : (
                  <TextInput
                    placeholder={f.label}
                    placeholderTextColor='#1A1A1A'
                    keyboardType="numeric"
                    style={styles.input}
                    value={selectedValues[f.key] || ""}
                    onChangeText={(text) =>
                      setSelectedValues((s) => ({ ...s, [f.key]: text }))
                    }
                  />
                )}
              </View>
            ))}
          </View>

              {(activeFilter) && (
                <View style={styles.overlay}>
                  <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    onPress={closeAllPanels}
                    activeOpacity={1}
                  />

                  <Animated.View
                    style={[
                      styles.dropdownPanel,
                      {
                        transform: [{ translateY: dropAnim }],
                        right: activeFilter === "price" ? 0 : undefined,
                        left: activeFilter !== "price" ? 0 : undefined,
                        height:  activeFilter === 'price'? 100 : PANEL_HEIGHT,
                        width: activeFilter === "price" ? 110 : activeFilter === "capacity" ? 110 : PANEL_WIDTH,
                      },
                    ]}
                  >
                    {activeFilter && (
                      <>
                        {filterDefs
                          .find((f) => f.key === activeFilter)
                          ?.options?.map((opt) => (
                            <TouchableOpacity
                              key={opt}
                              style={styles.option}
                              onPress={() => {
                                handleSelect(activeFilter, opt);
                                closeAllPanels();
                              }}
                            >
                              <View style={styles.optionContent}>
                                <Text style={styles.optionText}>{opt}</Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                      </>
                    )}
                  </Animated.View>
      </View>
      )}

        <Text style={{fontFamily: "Inter_600SemiBold",fontSize: 28,lineHeight: 100,fontWeight: "600",paddingHorizontal: 15}}
        >
          Featured Yachts
        </Text>

        <View style={styles.yacht}>
                  {filteredBoats.map((b) => (
                    <View key={b._id} style={{backgroundColor: 'white', borderRadius: 4, paddingHorizontal: 5.5, 
                      paddingVertical: 10,}}
                    >
                      {Array.isArray(b?.media) && b.media.length > 0 && (
                        <Image
                          source={{ uri: b.media[0].url }}
                          style={{ width: 150, height: 100, borderRadius: 5 }}
                          resizeMode="cover"
                        />
                      )}



                      <Text style={{fontWeight: 500, fontSize: 12, fontFamily: 'Inter_500Medium', marginTop:8}}>{b.boatName}</Text>
                      <Text style={{color: '#737373', fontSize: 10, fontFamily: 'Inter_400Regular', marginTop:5}}>⭐ 4.5 {b.reviews}</Text>
                      <Text style={{color: '#737373', fontSize: 10, fontFamily: 'Inter_400Regular', marginTop:5}}>Capacity: {b.capacity} • {b.location}</Text>
        
                      <View style={{flexDirection:'row', justifyContent: 'space-between', gap: 2.8, marginTop:10}}>
                        <View style={styles.priceTag}>
                          <Text style={styles.priceText}>₦{b.pricePerHour.toLocaleString()}</Text>
                          <Text style={{color:'#868484',fontSize: 10, fontFamily: 'Inter_500Medium'}}>/hr</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.button}
                          onPress={() =>
                            router.push({
                              pathname: "/(tabs)/YachtDetails",
                              params: { boatId: b._id },
                            })
                          }
                        >
                          <Text style={{ color: "white", fontWeight: 500, fontSize: 12, fontFamily: 'Inter_500Medium' }}>View Details</Text>
                        </TouchableOpacity>
                      </View>
                      
                    </View>
                  ))}
                
          {filteredBoats.length === 0 && (
            <View style={styles.empty}>
              <Text>No yachts match your filters.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}


const styles = StyleSheet.create({
    navBar:{
      backgroundColor:'#1A1A1A',
      height: 70,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 10,
    },

    slidePanel: {
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
    
    filterContainer: {
      flexDirection: "row",
      justifyContent:'space-between',
      paddingHorizontal: 10,
      paddingVertical: 10,
    },

    dropdownPanel: {
      position: "absolute",
      top: 370,
      left: 0,
      right: 0,
      height: PANEL_HEIGHT,
      width: PANEL_WIDTH,
      backgroundColor: "#FFF",
      padding: 20,
      borderBottomLeftRadius: 3.45,
      borderBottomRightRadius: 3.45,
      elevation: 8,
  },
    filterBox: {
      flex: 1,
      width:76.21
    },
  
    input: {
      borderWidth: 1,
      borderColor: "#ccc",
      paddingHorizontal: 6.91,
      paddingVertical: 6.8,
      borderRadius:3.45,
      fontSize: 10,
      fontFamily:'Inter_500Medium', 
      fontWeight: 500,
      color: 'red'
    },

    capacityDropdown: {},

    down:{
      flexDirection:'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6.91,
      paddingVertical: 6,
    },

    yacht: {
      paddingHorizontal: 10,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
      justifyContent: 'space-between',
      alignItems: 'center',
      borderRadius: 3.42,
      marginBottom: 50
    },

    priceTag:{
      gap:0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
        
    },

    priceText:{
      fontFamily: 'Inter_600SemiBold',
      fontSize:10
    },

    button: {
      backgroundColor: '#171717',
      borderRadius: 50,
      paddingVertical: 2.16,
      paddingHorizontal: 4,
    },

    empty: { 
      width: "100%", 
      alignItems: "center", 
      paddingVertical: 24 
    },

    filterRow: {
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: 16,
    },

    dropdown: {
      borderWidth: 1,
      borderColor: "#ccc",
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 3.45,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      color: '#171717',
      gap:5,
    },

    dropdownText: {
      fontSize: 10,
      fontFamily: "Inter_500Medium",
      color: "#171717",
    },

    profileBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: "#FFF",
      justifyContent: "center",
      alignItems: "center",
    },

    overlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 99,
    },

    panel: {
      position: "absolute",
      right: 0,
      top: 0,
      bottom: 0,
      width: PANEL_WIDTH,
      backgroundColor: "#FFF",
      padding: 20,
      borderTopLeftRadius: 20,
      borderBottomLeftRadius: 20,
      elevation: 10,
    },

    panelTitle: {
      fontSize: 18,
      fontFamily: "Inter_600SemiBold",
      marginBottom: 20,
    },

    panelItem: {
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderColor: "#EEE",
    },

    panelText: {
      fontSize: 15,
      fontFamily: "Inter_400Regular",
    },

    option: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10,
      borderColor: "#EEE",
    },

    optionText: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
    },
    optionContent: {
      flex: 1,          
    alignItems: "center",
    },
})