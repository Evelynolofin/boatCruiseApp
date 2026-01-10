import {
    StatusBar,
    Text,
    View,
    StyleSheet,
    TextInput,
    Image,
    TouchableOpacity,
    ScrollView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons";
import { useState, useRef, use, useEffect } from "react";
import { router} from 'expo-router'
import AsyncStorage from "@react-native-async-storage/async-storage";
import { httpClient } from "@/constants/httpClient";
import { Alert } from "react-native";

export default function Userprofile (){
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("")

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [loading, setLoading] = useState(false);


  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem("userEmail");
        const savedFullName = await AsyncStorage.getItem("userName");
        const savedPhone = await AsyncStorage.getItem("userPhone");

        if (savedEmail) setEmail(savedEmail);
        if (savedFullName) setFullName(savedFullName);
        if (savedPhone) setPhone(savedPhone);
      } catch (err) {
        console.log("Error loading user info:", err);
      }
    };
    loadUserInfo();
  }, []);

const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return Alert.alert("Error", "All fields are required");
    }

    if (newPassword.length < 8) {
      return Alert.alert("Error", "Password must be at least 8 characters");
    }

    if (newPassword !== confirmPassword) {
      return Alert.alert("Error", "Passwords do not match");
    }

    try {
      setLoading(true);

      const res = await httpClient.post(
        "/auth/change-password",
        {
          currentPassword,
          newPassword,
        },
      );

      console.log("CHANGE PASSWORD SUCCESS:", res.data);

      Alert.alert("Success", "Password changed successfully");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.log(
        "CHANGE PASSWORD ERROR:",
        error.response?.data || error.message
      );

      Alert.alert(
        "Error",
        error.response?.data?.message || "Failed to change password"
      );
    } finally {
      setLoading(false);
    }
  };

  return(
    <>
      <ScrollView style={{backgroundColor: '#F8F8F8'}}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={{paddingHorizontal: 10, paddingVertical: 50}}>
          <TouchableOpacity 
              style={{flexDirection: 'row', gap: 2, alignItems:'center', marginTop:20}}
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
          <View style={{flexDirection: 'column', justifyContent:'center', alignItems:'center', gap:10, marginBottom: 30}}>
            <Ionicons name="person-circle-outline" size={60} color="#1A1A1A"/>
            <Text>{email}</Text>
            <Text>{phone}</Text>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#828789"
            />
            <TextInput
            value={email}
            placeholder="User@gmail.com"
            editable={false}
          />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="call-outline"
              size={20}
              color="#828789"
            />
            <TextInput
            value={phone}
            placeholder="User PhoneNumber"
            editable={false}
          />
          </View>

          <TouchableOpacity
            style={{flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E6E6E6",
              borderRadius: 5, paddingHorizontal: 10, paddingVertical: 12, marginTop: 20, marginHorizontal: 15,
              gap: 20
            }}
            onPress={() => setShowChangePassword(!showChangePassword)}
          >
            <Ionicons name="lock-closed-outline" size={20} color="#828789" />

            <Text style={{color: 'black'}}>Change Password</Text>

            <Ionicons
              name={showChangePassword ? "chevron-up-outline" : "chevron-down-outline"}
              size={20}
              color="#828789"
            />
          </TouchableOpacity>
          {showChangePassword && (
          <View>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#828789" />
              <TextInput
                style={styles.input}
                placeholder="Current password"
                placeholderTextColor="black"
                secureTextEntry={!showCurrent}
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                <Ionicons
                  name={showCurrent ? "eye-outline" : "eye-off-outline"}
                  size={20}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-open-outline" size={20} color="#828789" />
              <TextInput
                style={styles.input}
                placeholder="New password"
                placeholderTextColor="black"
                secureTextEntry={!showNew}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                <Ionicons
                  name={showNew ? "eye-outline" : "eye-off-outline"}
                  size={20}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="checkmark-done-outline" size={20} color="#828789" />
              <TextInput
                style={styles.input}
                placeholder="Confirm new password"
                secureTextEntry={!showConfirm}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                <Ionicons
                  name={showConfirm ? "eye-outline" : "eye-off-outline"}
                  size={20}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={{backgroundColor: "#1A1A1A", marginTop: 30, paddingHorizontal: 8, 
                paddingVertical: 16, borderRadius: 100, marginHorizontal: 15
              }}
              onPress={handleChangePassword}
              disabled={loading}
            >
              <Text style={{color:'white', textAlign: 'center'}}>
                {loading ? "Updating..." : "Change Password"}
              </Text>
            </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  )
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E6E6E6",
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginTop: 20,
    marginHorizontal: 15,
    gap: 20
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
})

