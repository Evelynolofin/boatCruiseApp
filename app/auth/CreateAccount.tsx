import {
    StatusBar,
    Text,
    View,
    StyleSheet,
    TextInput,
    Image,
    TouchableOpacity,
} from "react-native"
import { Ionicons } from "@expo/vector-icons";
import { useState, useRef, use } from "react";
import { router} from 'expo-router'
import { httpClient } from "@/constants/httpClient";
import axios from "axios";

export default function createAccount () {
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");

    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const passwordRef = useRef<TextInput>(null);
    const phoneRef = useRef(null)
    const confirmPasswordRef = useRef<TextInput>(null);

    const [errors, setErrors] = useState({
        email: '',
        mobile: '',
        password: '',
        confirmPassword: ''
    })

    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState("");


    const validate = () =>{
        let valid = true;
        const newErrors = { email: "", mobile: "", password: "", confirmPassword: "" };

        if (!email.trim()){
            newErrors.email= 'Email is required'
            valid = false
        };
        if (!phoneNumber.trim()){
            newErrors.mobile= 'Mobile number is required'
            valid = false;
        };
        if (!password.trim()){
            newErrors.password= 'Password is required'
            valid = false;
        };
        if (!confirmPassword.trim()) {
            newErrors.confirmPassword = "Please confirm your password";
            valid = false;
        };
        if (password && confirmPassword && password !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
            valid = false;
        }

         setErrors(newErrors);
        return valid;
    };

    const handleSignup = async () => {
    if (!validate()) return;

    setLoading(true);
    setApiError("");

    try {
      const response = await httpClient.post(
        "/auth/signup",
        {
          email: email.trim(),
          password: password.trim(),
          phoneNumber: phoneNumber.trim(),
        }
      );

      console.log("SIGNUP SUCCESS:", response.data);

      setLoading(false);

      router.push({
        pathname: "/auth/Verification",
        params: {email},
      });
    } catch (error) {
      setLoading(false);

      if (axios.isAxiosError(error)) {
        console.log("SIGNUP ERROR:", error.response?.data || error.message);
        setApiError(
          error.response?.data?.message || "Signup failed. Please try again."
        );
      } else {
        setApiError("Signup failed. Please try again.");
      }
    }
  };


    return(
        <>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.container}>
            <View style={styles.form}>
                <Text style={styles.headerText}>
                Create account
                </Text>

                {apiError ? (
                    <Text style={{ color: "red", marginTop: 10 }}>{apiError}</Text>
                ) : null}

                <Text style={styles.label}>Email</Text>
                <TextInput 
                style={[styles.input, { borderColor: errors.email ? "red" : "#E6E6E6" }]}
                placeholder="Enter your email address"
                placeholderTextColor='#828789'
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                returnKeyType="next"
                onChangeText={(t) =>{
                    setEmail(t);
                    setErrors({...errors, email: ''})
                }}
                />
                {errors.email ? <Text style={{ color: "red" }}>{errors.email}</Text> : null}

                <Text style={styles.label}>Mobile</Text>
                <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                    <View style={[styles.phoneBox, {borderColor: errors.mobile ? "red" : "#E6E6E6" }]}>
                    <Image 
                    source={require('@/assets/images/nigeria.png')}
                    />
                    <Text>(+234)</Text>
                    </View>
                    <TextInput
                    style={[styles.inputNumber, { flex: 1, borderColor: errors.mobile ? "red" : "#E6E6E6" }]}
                    placeholder="Enter Phone number"
                    placeholderTextColor='#828789'
                    keyboardType="phone-pad"
                    ref={phoneRef}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current ?.focus()}
                    onChangeText={(t) => {
                        setPhoneNumber(t);
                        setErrors({...errors, mobile: ''})
                    }}
                    />
                </View>
                {errors.mobile? <Text style={{color:'red'}}>{errors.mobile}</Text>: null}

                <Text style={styles.label}>Password</Text>
                    <View style={[styles.passwordContainer, {borderColor: errors.password ? "red" : "#E6E6E6" }]}>
                        <TextInput
                        style={[styles.input2, { flex: 1, borderWidth: 0 }]}
                        placeholder="********"
                        secureTextEntry={!showPassword}
                        placeholderTextColor='#828789'
                        ref={passwordRef}
                        returnKeyType="next"
                        onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                        onChangeText={(t)=>{
                            setPassword(t)
                            setErrors({...errors, password: ''})
                        }}
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
                    {errors.password? <Text style={{color: 'red'}}>{errors.password}</Text>: null}

                <Text style={styles.label}>Confirm Password</Text>
                    <View style={[styles.passwordContainer, {borderColor: errors.confirmPassword ? "red" : "#E6E6E6" }]}>
                        <TextInput
                        style={[styles.input2, { flex: 1, borderWidth: 0 }]}
                        placeholder="********"
                        secureTextEntry={!showConfirmPassword}
                        placeholderTextColor='#828789'
                        ref={confirmPasswordRef}
                        onChangeText={(t) => {
                            setConfirmPassword(t)
                            setErrors({...errors, confirmPassword: ''})
                        }}
                        />
                        <TouchableOpacity
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            <Ionicons 
                            name={showConfirmPassword ? 'eye-outline' : "eye-off-outline"}
                            size={20}
                            />
                        </TouchableOpacity>
                    </View>
                    {errors.confirmPassword? <Text style={{color:'red'}}>{errors.confirmPassword}</Text>:null}

                <TouchableOpacity style={styles.createButton}
                onPress={handleSignup}
                >
                    <Text style={styles.createText}>
                        {loading ? "Creating..." : "Create account"}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.guestButton}
                 onPress={ () => router.navigate('/(tabs)/HomePage')}
                >
                    <Text style={styles.guestText}>Continue as Guest</Text>
                </TouchableOpacity>
                
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 5, justifyContent: 'center', marginTop: 20}}>
                    <Text style={styles.loginText}>Already have an account?</Text>
                    <TouchableOpacity
                        onPress={() => router.navigate('/auth/Login')}
                    >
                        <Text style={styles.loginBold}>Login</Text>
                    </TouchableOpacity>
                </View>
            </View>
            
            <Text style={styles.footer}>© 2025 BoatCruise. All rights reserved.</Text>
        </View>
        </>
    )
}

const styles= StyleSheet.create({
    container: {
        backgroundColor: '#f6f6f6',
        flex: 1,
        paddingHorizontal: 25,
    },

    form:{
        backgroundColor: "#fff",
        padding: 25,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 10,
        width: "100%",
        elevation: 2,
        marginTop: 50,
        // marginHorizontal: 5,
    },

    headerText:{
        fontFamily: 'Inter_600SemiBold',
        textAlign: 'center',
        fontSize: 24,
    },

    label:{
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        marginTop: 20
    },

    input: {
        borderWidth: 1,
        borderColor: "#E6E6E6",
        borderRadius: 5,
        paddingHorizontal: 15,
        paddingVertical: 15,
        gap: 8,
        marginTop:10,
    },

    input2: {
        borderRadius: 10,
        paddingVertical: 15,
        fontSize: 16,
    },

    inputNumber: {
        borderWidth: 1,
        borderColor: "#E6E6E6",
        borderRadius: 5,
        paddingHorizontal: 15,
        paddingVertical: 16,
        gap: 8,
        borderBottomLeftRadius: 0,
        borderTopLeftRadius: 0
    },

    phoneBox:{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: "#E6E6E6",
        paddingHorizontal: 15,
        paddingVertical: 15,
        borderRadius: 8,
        borderBottomRightRadius: 0,
        borderTopEndRadius: 0,
        gap: 5.
    },

    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: "#E6E6E6",
        borderRadius: 5,
        paddingHorizontal: 14,
        gap: 8,
        marginTop:10,
    },

    createButton:{
        backgroundColor: "#1A1A1A",
        marginTop: 30,
        paddingHorizontal: 8,
        paddingVertical: 16,
        borderRadius: 100,
    },

    createText:{
        color: 'white',
        textAlign: 'center',
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
    },

    guestText: {
        color: 'black',
        textAlign: 'center',
        fontFamily: 'Inter_600SemiBold',
        fontSize: 16,
    },

    guestButton:{
        marginTop: 20,
        paddingHorizontal: 8,
        paddingVertical: 16,
        borderRadius: 100,
        borderWidth: 1
    },

    loginText:{
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
    },

    loginBold:{
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        fontWeight: 700
    },

    footer: {
    fontFamily: 'Inter_400Regular',
    fontWeight: 400,
    marginTop: 20,
    fontSize: 12,
    color: "#404040",
    textAlign: 'center',
    },
})