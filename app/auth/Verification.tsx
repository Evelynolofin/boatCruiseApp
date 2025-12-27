import {
    View,
    ImageBackground,
    StatusBar,
    TouchableOpacity,
    StyleSheet,
    Text,
    TextInput,
    Alert,
    ActivityIndicator
} from "react-native"
import React, { useState, useEffect, useRef } from "react"
import { httpClient } from "@/constants/httpClient";
import { router, useLocalSearchParams } from "expo-router";

type VerifyParams = {
  email?: string;
  token: string;
};

export default function Verification(){
    const { email, token } = useLocalSearchParams<VerifyParams>();
    
    const [timer, setTimer] = useState(300);
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);

    const [loading, setLoading] = useState(false);
    const [Error, setError] = useState("");

    const inputRefs = useRef<TextInput[]>([]);

    const [resendOtp, setResendOtp] = useState(60)

    const [resendTimer, setResendTimer] = useState(0);
    const [canResend, setCanResend] = useState(true);
    

    useEffect(() => {
        if (timer === 0) return;
        const countdown = setInterval(() => setTimer(timer - 1), 1000);
        return () => clearInterval(countdown);
    }, [timer]);

    useEffect(() => {
        if (resendOtp === 0) return;
        const cooldown = setInterval(() => setResendOtp(resendOtp - 1), 1000);
        return () => clearInterval(cooldown);
    }, [resendOtp]);


    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? "0" : ""}${secs}`
    };

    const handleChange = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;
    

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
}

    const verifyOtp = async () => {
    const otpcode = otp.join("");

    if (otpcode.length !== 6) {
      return setError("Enter the complete 6-digit code");
    }

    setLoading(true);
    setError("");

    try {

      setLoading(true);

      const response = await httpClient.post(
        "/auth/verify-otp",
        {
          email: String(email),
          otp: otpcode,
        },
      );

      Alert.alert("Success", "Verification Successful!", [
              {
                text: "OK",
                onPress: () =>
                  router.push({
                    pathname: "/(tabs)/HomePage",
                    params: { token: response.data.token },
                  }),
              },
            ]);
        } catch (error: any) {
          
          setError(error.response?.data?.message || "invalid or expired OTP")
        } finally{
          setLoading(false)

        }
  };

    const resend = async () => {
        if (!canResend || resendTimer > 0) {
      return Alert.alert(
        "Please wait", 
        `You can resend the code in ${resendTimer} seconds`
      );
    }

        if (!email) {
          return Alert.alert("Error", "Email not found. Please go back and try again.");
        }

        setLoading(true);
        setError("");

        try {
          const response = await httpClient.post(
            "/auth/resend-otp",
            {
              email: String(email),
            }
          );
          setOtp(["", "", "", "", "", ""]);
          
          setResendTimer(60);
          setCanResend(false);

        Alert.alert(
          "Success", 
          response.data?.message || "A new verification code has been sent to your email"
        );
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 
                            error.message || 
                            "Failed to resend code. Please try again.";
        
        Alert.alert("Error", errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
};

    return(
        <>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View>
            <ImageBackground
                source={require('@/assets/images/image 25.png')}
                style={styles.background}
                resizeMode="cover"
            >
                <View style={styles.container}>
                    <Text style={styles.headerText}>Verification</Text>
                    <Text style={styles.subText}>
                        Thank you for signing up on BoatCruise. Please check your email {email
                        ? String(email).replace(/(.{2}).+(@.+)/, "$1***$2")
                        : "your email"}, 
                        we have sent you a verification code to complete your account
                    </Text>

                    <Text style={styles.label}>Input your verification code here</Text>

                    <View style={styles.codeContainer}>
                       {otp.map((digit, index) => (
                            <TextInput
                            key={index}
                            style={styles.codeInput}
                            maxLength={1}
                            keyboardType="number-pad"
                            value={digit}
                            onChangeText={(value) => handleChange(value, index)}
                            onKeyPress={({ nativeEvent }) => {
                              if (nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
                                  inputRefs.current[index - 1]?.focus();
                                }
                            }}
                            ref={el => { inputRefs.current[index] = el! }}
                            />
                        ))}
                    </View>

                    {Error ? (
                        <Text style={{ color: "red", marginBottom: 10 }}>{Error}</Text>
                    ) : null}

                    <Text style={styles.timer}>
                        Code expires in <Text style={{ color: "#0028D0" }}>{formatTime(timer)}</Text>
                    </Text>

                    <TouchableOpacity style={styles.verifyButton}
                        onPress={verifyOtp}
                        disabled={loading}
                    >
                        {loading ? (
                          <ActivityIndicator color='white'/>  
                        ) : (
                            <Text style={styles.verifyText}>
                                {loading ? "Verifying..." : "Verify Code"}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.resendButton, resendOtp > 0 &&{marginTop: 8, opacity: 0.5, borderBlockColor: "#1A1A1A", borderWidth:1,
                        paddingHorizontal: 8, paddingVertical: 16, borderRadius: 100, marginBottom: 20} ]}
                        onPress={resend}
                        disabled={resendOtp > 0 || loading}
                    >
                        <Text style={{fontFamily: 'Inter_600SemiBold', fontSize: 16,
                        textAlign: 'center'
                        }}>
                            {resendOtp > 0 ? `Resend OTP in ${resendOtp}s` : "Resend OTP"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ImageBackground>
        </View>
        </>
    )
}

const styles= StyleSheet.create({
  background:{
      flex: 1,
      height: 770,
      justifyContent: "center",
      alignItems: "center",
  },

  container:{
      backgroundColor: "#fff",
      padding: 25,
      borderRadius: 12,
      height: 480,
      marginTop: 800,
      marginHorizontal: 10,
  },

  headerText:{
      fontFamily: 'Inter_600SemiBold',
      fontSize: 24,
  },

  subText:{
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      marginTop: 5,
      marginBottom: 40,
  },

  label:{
        fontWeight:400,
        fontSize: 12,
        fontFamily: 'Inter_400Regular',
        paddingBottom: 15
  },

  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  codeInput: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 18,
  },
  timer: {
    textAlign: "center",
    marginBottom: 20,
    fontSize: 14,
  },

  verifyButton:{
        backgroundColor: "#1A1A1A",
        marginTop: 30,
        paddingHorizontal: 8,
        paddingVertical: 16,
        borderRadius: 100,
    },

    verifyText:{
        color: 'white',
        textAlign: 'center',
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
    },

    resendButton:{
        marginVertical: 8, 
        opacity: 0.5, 
        borderBlockColor: "#1A1A1A", 
        borderWidth:1,
        paddingHorizontal: 8, 
        paddingVertical: 16, 
        borderRadius: 100
    }
})