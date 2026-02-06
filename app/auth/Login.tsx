import {httpClient} from "@/constants/httpClient";
import {saveToken} from "@/constants/tokenFile";
import {Ionicons} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import {router} from "expo-router";
import {useRef, useState} from "react";
import {
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";


export default function login() {
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const handleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await httpClient.post("/auth/login", {
        email,
        password,
      });

      const token = res.data.data.accessToken;
      if (token) {
        await saveToken(token);
        await AsyncStorage.setItem("LoginTimestamp", Date.now().toString());
      }

        const user = res.data.data.user;
              if (user) {
                await AsyncStorage.setItem("userName", user.full_name || "");
                await AsyncStorage.setItem("userEmail", user.email || "");
                await AsyncStorage.setItem("userPhone", user.phoneNumber || "");
              }
              console.log("userEmail:", user?.email);
              console.log("userName:", user?.fullName);
              console.log("userPhone:", user?.phoneNumber);

      console.log("LOGIN SUCCESSFUL:");

      const savedBookingString = await AsyncStorage.getItem("pendingBooking")

      if (savedBookingString){
        const pendingBooking = JSON.parse(savedBookingString);

        if (pendingBooking?.isGuest) {
          setLoading(false)

          router.push({
            pathname: "../BookingPage",
            params:{
              boatId: pendingBooking.boatId,
              selectedDate: pendingBooking.selectedDate,
              startTime: pendingBooking.startTime,
              endTime: pendingBooking.endTime,
              occasion: pendingBooking.occasion,
              guest: pendingBooking.guest,
              specialRequest: pendingBooking.specialRequest || "",
              resumeBooking: "true",
            },
          });
          return
        }
      }

      setLoading(false);

      router.navigate("/(tabs)/HomePage");
    } catch (err: unknown) {
      setLoading(false);

      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Login failed. Try again");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Login failed. Try again");
      }
    }
  };

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <View style={styles.container}>
        <View style={styles.loginForm}>
          <Text style={styles.title}>Login</Text>

          {error ? (
            <Text style={{color: "red", marginTop: 10}}>{error}</Text>
          ) : null}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email address"
            placeholderTextColor="#828789"
            keyboardType="email-address"
            returnKeyType="next"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.input2, {flex: 1, borderWidth: 0}]}
              placeholder="********"
              secureTextEntry={!showPassword}
              placeholderTextColor="#828789"
              ref={passwordRef}
              returnKeyType="next"
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={{marginTop: 20}}
            onPress={() => router.navigate("/auth/ForgetPassword")}
          >
            <Text style={styles.forgetpasswordText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginText}>
              {loading ? "Logging in..." : "Login"}
            </Text>
          </TouchableOpacity>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              justifyContent: "center",
              marginTop: 20,
              marginBottom: 100,
            }}
          >
            <Text style={styles.signupText}>Don’t have an account?</Text>
            <TouchableOpacity
              onPress={() => router.navigate("/auth/CreateAccount")}
            >
              <Text style={styles.signupBold}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footer}>
          © 2025 BoatCruise. All rights reserved.
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f6f6f6",
    flex: 1,
    paddingHorizontal: 25,
  },

  loginForm: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    width: "100%",
    elevation: 2,
    marginTop: 90,
  },

  title: {
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    fontSize: 24,
  },

  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    marginTop: 20,
  },

  input: {
    borderWidth: 1,
    borderColor: "#E6E6E6",
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 15,
    gap: 8,
    marginTop: 10,
  },

  input2: {
    borderRadius: 10,
    paddingVertical: 15,
    fontSize: 16,
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E6E6E6",
    borderRadius: 5,
    paddingHorizontal: 15,
    gap: 8,
    marginTop: 10,
  },

  forgetpasswordText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    marginTop: 10,
  },

  loginButton: {
    backgroundColor: "#1A1A1A",
    marginTop: 30,
    paddingHorizontal: 8,
    paddingVertical: 16,
    borderRadius: 100,
  },

  loginText: {
    color: "white",
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
  },

  signupText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },

  signupBold: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    fontWeight: 700,
  },

  footer: {
    fontFamily: "Inter_400Regular",
    fontWeight: 400,
    marginTop: 20,
    fontSize: 12,
    color: "#404040",
    textAlign: "center",
  },
});
