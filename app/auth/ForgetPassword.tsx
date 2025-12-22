import {httpClient} from "@/constants/httpClient";
import {Ionicons} from "@expo/vector-icons";
import {router} from "expo-router";
import {useRef, useState} from "react";
import {
  ActivityIndicator,
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpVerified, setOtpVerified] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [step, setStep] = useState<"email" | "otp" | "reset">("email");

  const inputRefs = useRef<TextInput[]>([]);

  const handleChangeOtp = (value: string, index: number) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const sendResetCode = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }
    setLoading(true);
    try {
      await httpClient.post("/auth/forgot-password", {email});
      setStep("otp");

      Alert.alert("Success", "Reset code sent! Check your email.", [
        {
          text: "OK",
        },
      ]);
    } catch (err: any) {
      Alert.alert(
        "Error",
        err.response?.data?.message || "Failed to send reset code"
      );
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      setError("Enter the complete 6-digit code");
      Alert.alert("Error", "Enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await httpClient.post("/auth/verify-otp", {
        email: email,
        otp: otpCode,
      });

      setOtpVerified(true);
      setStep("reset");
      setLoading(false);
      Alert.alert(
        "Success",
        "OTP verified successfully! You can now reset your password.",
        [
          {
            text: "OK",
          },
        ]
      );
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Something went wrong. Please try again.";
      setError(errorMessage);
      Alert.alert("Error", errorMessage);
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    const otpCode = otp.join("");
    if (!email || !otpCode || !password || !confirmPassword) {
      Alert.alert("Error", "All fields are required");
      return;
    }
    if (!otpVerified) {
      Alert.alert("Error", "Please verify your OTP first");
      setStep("otp");
      return;
    }
    if (otpCode.length !== 6) {
      setError("Enter the complete 6-digit OTP");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await httpClient.post("/auth/reset-password", {
        email,
        otp: otpCode,
        password,
      });
      Alert.alert("Success", "Password reset successfully!", [
        {
          text: "OK",
          onPress: () => router.push("/auth/Login"),
        },
      ]);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to reset password";

      setError(errorMessage);

      if (
        errorMessage.toLowerCase().includes("otp") ||
        errorMessage.toLowerCase().includes("invalid") ||
        errorMessage.toLowerCase().includes("expired")
      ) {
        Alert.alert(
          "Error",
          errorMessage + "\n\nPlease verify your OTP again.",
          [
            {
              text: "OK",
              onPress: () => {
                setOtpVerified(false);
                setStep("otp");
              },
            },
          ]
        );
      } else if (
        errorMessage.toLowerCase().includes("same password") ||
        errorMessage.toLowerCase().includes("previous password") ||
        errorMessage.toLowerCase().includes("already used")
      ) {
        Alert.alert(
          "Error",
          "You cannot use your old password. Please choose a new one."
        );
      } else {
        Alert.alert("Error", errorMessage);
      }
    } finally {
      setLoading(false);
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
        <View style={styles.form}>
          {step === "email" && (
            <>
              <Text style={styles.headerText}>Forgot Password?</Text>
              <Text style={styles.subText}>
                Enter your email address to receive an OTP for resetting your
                password.
              </Text>

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#828789"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />

              <TouchableOpacity
                style={styles.resetButton}
                onPress={sendResetCode}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.resetText}>Send Reset Code</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {step === "otp" && (
            <>
              <Text style={styles.headerText}> Verify OTP</Text>
              <Text style={styles.subText}>
                Enter the otp sent to your email
              </Text>
              <Text style={styles.label}>OTP</Text>
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    style={styles.otpInput}
                    maxLength={1}
                    keyboardType="number-pad"
                    value={digit}
                    onChangeText={(value) => handleChangeOtp(value, index)}
                    onKeyPress={({nativeEvent}) => {
                      if (
                        nativeEvent.key === "Backspace" &&
                        !otp[index] &&
                        index > 0
                      ) {
                        inputRefs.current[index - 1]?.focus();
                      }
                    }}
                    ref={(el) => {
                      inputRefs.current[index] = el!;
                    }}
                  />
                ))}
              </View>

              <TouchableOpacity
                onPress={verifyOtp}
                disabled={loading}
                style={styles.resetButton}
              >
                <Text style={styles.resetText}>Enter otp</Text>
              </TouchableOpacity>
            </>
          )}
          {error ? <Text style={{color: "red"}}>{error}</Text> : null}

          {step === "reset" && (
            <>
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  textAlign: "center",
                  fontSize: 22,
                }}
              >
                {" "}
                Create New Password{" "}
              </Text>
              <Text style={styles.subText}>
                Avoid using weak or old passwords
              </Text>
              <Text style={styles.label}>New Password</Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderColor: "#E6E6E6",
                  borderRadius: 5,
                  paddingHorizontal: 14,
                  gap: 8,
                  marginTop: 10,
                  borderWidth: 1,
                }}
              >
                <TextInput
                  style={[styles.input2, {flex: 1, borderWidth: 0}]}
                  placeholder="********"
                  placeholderTextColor="#828789"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />

                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Confirm Password</Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderColor: "#E6E6E6",
                  borderRadius: 5,
                  paddingHorizontal: 14,
                  gap: 8,
                  marginTop: 10,
                  borderWidth: 1,
                }}
              >
                <TextInput
                  style={[styles.input2, {flex: 1, borderWidth: 0}]}
                  placeholder="********"
                  placeholderTextColor="#828789"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />

                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-outline" : "eye-off-outline"
                    }
                    size={20}
                  />
                </TouchableOpacity>
              </View>

              {error ? <Text style={{color: "red"}}>{error}</Text> : null}

              <TouchableOpacity
                style={styles.resetButton}
                onPress={resetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.resetText}>Reset Password</Text>
                )}
              </TouchableOpacity>
            </>
          )}
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
  form: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    width: "100%",
    elevation: 2,
    marginTop: 100,
    // paddingVertical:50,
  },
  headerText: {
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    fontSize: 24,
  },
  subText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    textAlign: "center",
    marginTop: 5,
    marginBottom: 30,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    paddingTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E6E6E6",
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginTop: 10,
  },

  input2: {
    borderRadius: 10,
    paddingVertical: 15,
    fontSize: 16,
  },

  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  otpInput: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 18,
    marginTop: 15,
  },

  resetButton: {
    backgroundColor: "#1A1A1A",
    marginTop: 30,
    paddingHorizontal: 8,
    paddingVertical: 16,
    borderRadius: 100,
    marginBottom: 10,
  },
  resetText: {
    color: "white",
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  signupText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  signupBold: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    fontWeight: "700",
  },
  footer: {
    fontFamily: "Inter_400Regular",
    fontWeight: "400",
    marginTop: 20,
    fontSize: 12,
    color: "#404040",
    textAlign: "center",
  },
});
