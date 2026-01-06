import { ScrollView,
        Text,
        Image,
        View,
        StatusBar,
        StyleSheet,
        TouchableOpacity,
        Dimensions,
 } from "react-native";
import {
        useFonts,
        Inter_300Light,
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
 } from '@expo-google-fonts/inter'
import * as NavigationBar from "expo-navigation-bar";
import {Feather, Ionicons} from '@expo/vector-icons'
import {Arimo_700Bold} from '@expo-google-fonts/arimo'
import {useRouter, router} from 'expo-router'
import { useEffect, useState } from "react";
import { httpClient } from "@/constants/httpClient";


type MediaItem = { url: string };

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


export default function homepage(){
  const [fontsLoaded] = useFonts({
        Inter_400Regular,
        Inter_500Medium,
        Inter_600SemiBold,
        Inter_300Light,
        Arimo_700Bold,
    })

    useEffect(() => {
  async function setNavBar() {
    await NavigationBar.setBackgroundColorAsync('transparent');
    await NavigationBar.setButtonStyleAsync('light');
  }
  setNavBar();
}, []);

    const router = useRouter()

    const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [boats, setBoats] = useState<Boat[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const availableBoats = boats.filter(boat => boat.pricePerHour > 0);
    const boatsToDisplay = availableBoats?.slice(0, 6) || [];


    useEffect(() => {
        const fetchBoats = async () => {
        try {
            setLoading(true);
            setError(null);
    
            const res = await httpClient.get("/boats");
    
            // console.log({response: res.data.data})
            // console.log({})
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

    
if (!fontsLoaded){
        return null
    }

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

    const data = [
    {image: require("@/assets/images/Group 2.png"),
    desc: 'Birthday Party',
    text: 'Get ready to celebrate in style, not on land, but on water! 🌊'
    },
    {image: require("@/assets/images/Group 3.png"),
    desc: 'Date Night',
    text: 'Set sail into the night with the one who makes your heart smile. 💖.'
    },
    {image: require("@/assets/images/Group 4.png"),
    desc: 'Corporate Event',
    text: 'Let’s celebrate success, strengthen connections, and enjoy a new kind'
    },
]

    const item =[
        {
            desc: "500+",
            text: 'Happy Customers'
        },
        {
            desc: "20+",
            text: 'Verified Operators'
        },
        {
            desc: "500+",
            text: '⭐ Average Rating'
        },
    ]

    const card=[
        {
            id: 1,
            desc: 'Search & Discovered',
            text: 'Browse verified boats and operators with transparent pricing.'
        },
        {
            id: 2,
            desc: 'Compare & Choose',
            text: 'Review details, read ratings, and select your perfect cruise.'
        },
        {
            id: 3,
            desc: 'Book Securely',
            text: 'Complete your booking with secure payment and instant confirmation.'
        },
        {
            id: 4,
            desc: 'Enjoy Your Cruise',
            text: 'Arrive at the jetty and experience an unforgettable time on the water.'
        }
    ]

  return(
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView style={{backgroundColor: '#F8F8F8'}}>
        <View style={styles.section}>
            <Text style={{fontFamily: 'Inter_600SemiBold',fontSize: 16, color: '#171717'}}>
                Find A Cruise For Any Occasion
            </Text>
            <Text style={{fontFamily: 'Inter_400Regular', fontSize: 12, color: '#737373', marginTop: 5}}>
                Explore our top-rated yachts for rent, carefully selected by the Boatcruise review team
            </Text>
            <View style={{flexDirection:'row', justifyContent:'space-evenly', gap: 5, paddingVertical: 16,}}>
                {data.map((data, index) => (
                    <TouchableOpacity key={index}
                    >
                        <Image
                        source={data.image}
                        style={styles.topImage}
                        />         
                    </TouchableOpacity>  
                ))}
            </View>
        </View>

        <View style={styles.yacht}>
            <>
                {availableBoats.slice(0,6).map((b) => (
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
                        <View style={[styles.priceTag, {flexDirection: 'row', alignItems:'center'}]}>
                            <Text style={styles.priceText}>₦{b.pricePerHour.toLocaleString()}</Text>
                            <Text style={{color:'#868484',fontSize: 10, fontFamily: 'Inter_500Medium'}}>/hr</Text>
                        </View>
                        <View>
                            <Text style={{color: 'black', fontWeight: 500, fontSize: 12, fontFamily: 'Inter_500Medium' }}>₦{b.pricePerHour.toLocaleString()}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() =>
                            router.push({
                                pathname: "/YachtDetails",
                                params: { boatId: b._id },
                            })
                            }
                        >
                            <Text style={{ color: "white", fontWeight: 500, fontSize: 12, fontFamily: 'Inter_500Medium' }}>View Details</Text>
                        </TouchableOpacity>
                        </View>
                        
                    </View>
                    ))}
                
            {availableBoats.length === 0}
            </>
        </View>

        <TouchableOpacity style={{flexDirection:'row',width: 113, height: 48,gap:8, paddingVertical: 12, paddingHorizontal: 20,}}
            onPress={() => router.navigate('/(tabs)/FeaturedYacht')}
        >
            <Text style={{fontWeight:500, fontSize: 14, color: '#171717'}}>See all</Text>
            <Ionicons name="arrow-forward" size={20} color="#171717" style={{fontWeight:500,}}/>
        </TouchableOpacity>

        <View style={styles.rating}>
                {item.map((item, index) => (
                    <View key={index} style={{paddingVertical: 16,}}>
                        <Text style={{fontWeight: 500, fontSize: 36, color: 'white', textAlign: 'center'}}>{item.desc}</Text>
                        <Text style={{fontWeight: 400, fontSize: 16, color: 'white'}}>{item.text}</Text>
                    </View>
                ))
                }
        </View>

        <View style={{paddingHorizontal: 8}}>
            <View style={{marginVertical: 30, flexDirection:'column', alignItems: 'center'}}>
                <Text style={{fontWeight: 600, fontSize: 20, color: '#171717', lineHeight: 31}}>
                    How to Sail, Spend, and Stay Connected with Boat  Cruises
                </Text>
                <Text style={{fontWeight: 400, fontSize: 16, color: '#737373', paddingRight: 16, paddingTop: 5, lineHeight: 20}}>
                    Discover the perfect blend of adventure, leisure and connection on every wave'
                </Text>
            </View>
            
            <View style={{flexDirection:'column', alignItems: 'center'}}>
                <Image
                source={require("@/assets/images/image 19 .png")}
                style={{height: 226.32, borderRadius: 5.62, marginTop: 16, paddingHorizontal: 0}}
                />
            </View>

            <View style={{gap: 11.26, marginBottom: 50}}>
                {card.map((card) => (
                    <View key={card.id} style={{flexDirection:'row', alignItems:'center'}}>
                        <Text style={{backgroundColor:'#EAEAEA', width:20.27, height: 20.27, textAlign: 'center', borderRadius: 3.38}}>
                            {card.id}
                        </Text>
                        <View style={{marginHorizontal: 10, paddingTop:16}}>
                            <Text style={{fontWeight: 500, fontSize: 14, color: '#171717'}}>{card.desc}</Text>
                            <Text style={{fontWeight: 400, fontSize: 10, color: '#737373',marginRight: 20}}>{card.text}</Text>
                        </View>
                    </View>
                ))}
            </View>
        </View>
        </ScrollView>
    </>
  )
}

const styles= StyleSheet.create({
    heroContainer: {
        backgroundColor: '#A2A2A2',
        width: 246,
        height: 104.07,
        borderRadius: 5.96,
        marginTop: 40,
    },

    navBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 180
    },
   
    getStarted: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        borderColor: 'white',
        borderWidth: 0.54,
        borderRadius: 27.21,
        padding: 4,
    },

    section:{
        paddingHorizontal: 8,
        paddingTop: 50,
        paddingBottom: 16
    },

    topImage:{
        height: 108.77,
    },

    yacht: {
        paddingHorizontal: 14,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        justifyContent:"space-between" ,
        alignItems: 'center'
    },

    priceTag:{
        backgroundColor:"#171717",
        position:'absolute', 
        bottom: 110, 
        right: 8,
        // gap:4.27,
        paddingVertical: 1.71,
        paddingHorizontal: 3.42,
        borderRadius: 2.56,
        flexDirection: 'row'
    },

    priceText:{
        color: '#FDFAFA',
        fontWeight:600,
        fontSize: 6.83,
    },

    rating:{
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: '#1A1A1A',
        gap: 7.15,
        paddingVertical: 30,
        marginTop: 40
    },

    startButton:{
        backgroundColor: "#1A1A1A",
        width: 124.03,
        height: 33.51,
        flexDirection:'row',
        justifyContent:'center',
        marginTop: 10,
        paddingHorizontal: 11.26,
        paddingVertical: 6.76,
        borderRadius: 28.16,
        gap: 4.5
    },

    startText:{
        color: 'white',
        textAlign: 'center',
        fontWeight:500,
        fontSize: 14,
    },

    button: {
        backgroundColor: '#171717',
        borderRadius: 50,
        paddingVertical: 2.16,
        paddingHorizontal: 4,
    }
})
