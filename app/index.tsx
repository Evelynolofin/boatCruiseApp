import { ScrollView,
        Text,
        Image,
        View,
        StatusBar,
        ImageBackground,
        StyleSheet,
        TouchableOpacity,
        Dimensions,
        Alert,
 } from "react-native";
import { router } from "expo-router";
import { useState, useEffect, useRef } from "react";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { removeToken } from "@/constants/tokenFile";
import { httpClient } from "@/constants/httpClient";

const {height, width} = Dimensions.get('window')
const isSmallScreen = height < 700;

SplashScreen.preventAutoHideAsync();
let ShownSplash = false;

export default function onboarding (){
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState(false);

    useEffect(() => {
       async function prepare (){
         if (!ShownSplash){
            ShownSplash = true
            
            await new Promise(resolve => setTimeout(resolve, 3000));
        } 
        setLoading(true)
        await SplashScreen.hideAsync();
       }
       prepare()
      }, []);

    if (!loading) {
        return (
          <View style={[styles.loaderContainer, {flexDirection:'row', alignItems: 'center', backgroundColor: '#004064', gap: 10}]}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <Image
            source={require('@/assets/images/logo.png')}
            />
            <Text style={{fontFamily:'Arimo_700Bold', fontWeight:700, fontSize: 18, color:'white'}}>BoatCruise</Text>
          </View>
        );
    }

    const handleGuest = async () => {
        try {
        await removeToken();

        const keys = [
        "userToken",
        "userData",
        "userId",
        "userEmail",
        "userName",
        "userPhone",
        "userProfile",
        "authToken",
        "bookings",
        "myBookings",
        "paymentReference",
        "refreshToken",
        "pendingBookings",
        "savedBookings",
        ];

        await AsyncStorage.multiRemove(keys);

        delete httpClient.defaults.headers.common["Authorization"];

        setProfile(false);

        await AsyncStorage.setItem("isGuest", "true");

        setLoading(true);

        router.replace("/(tabs)/HomePage");
    } catch (error) {
        console.error("handleGuest error:", error);
        Alert.alert(
        "Error",
        "An error occurred while continuing as guest. Please try again."
        );
    }
    };


    return(
        <>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <ImageBackground
            source={require('@/assets/images/image 29.png')}
            style={{flex:1}}
            >
                <View style={{paddingHorizontal: 20, marginTop: 50}}>
                    <View style={{flexDirection: 'row', marginTop: 40, alignItems: 'center', gap:10}}>
                    <Image
                    source={require('@/assets/images/logo.png')}
                    />
                    <Text style={{fontFamily: 'Arimo_700Bold', fontWeight: 700, fontSize: 18, color:'white'}}>BoatCruise</Text>
                    </View>

                    <View>
                        <Text style={{fontFamily:'Arimo_700Bold', fontWeight: 700, fontSize: 36, width: 243, color: 'white', paddingVertical: 16}}>
                            We’ve got a Boat for every moment.
                        </Text>

                        <Text style={{fontFamily:'Arimo_700Bold', fontWeight: 700, fontSize: 16, width: 150, color: 'white'}}>
                            Couple date night? Company cruise? Birthday cruise?
                        </Text>
                    </View>

                    <View style={{flex: 1, minHeight: isSmallScreen ? 100 : 700}}>
                        <View style={{marginTop: 270, flexDirection:'column', alignItems: 'center', gap: 10, marginBottom: 10}}>
                        <TouchableOpacity
                        onPress={() => router.navigate('/auth/CreateAccount')}
                        style={{backgroundColor: 'white', padding: 10, width: 213, borderRadius: 8}}
                        >
                            <Text style={{fontSize: 16, fontWeight: 700, color: '#001718', textAlign: 'center'}}>Create account</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                        style={{backgroundColor: 'white', padding: 10, width: 213, borderRadius: 8}}
                        onPress={handleGuest}
                        >
                            <Text style={{fontSize: 16, fontWeight: 700, color: '#001718', textAlign: 'center'}}>Continue as guest</Text>
                        </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                        onPress={() => router.navigate('/auth/Login')}
                        >
                            <Text style={{fontSize: 16, fontWeight: 700, color: 'white', textAlign: 'center'}}>Already have an account? Login</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ImageBackground>
        </>
    )
}


const styles= StyleSheet.create({
    loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
})
