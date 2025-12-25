import { useEffect, useState } from "react";
import { httpClient } from "@/constants/httpClient";
import { View, Text, ScrollView, Image, StyleSheet, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function BookingDetailPage() {
  const { id } = useLocalSearchParams();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) fetchBooking(id as string);
  }, [id]);

  const fetchBooking = async (bookingId: string) => {
    try {
      setLoading(true);
      const res = await httpClient.get(`/bookings/${bookingId}`);
      setBooking(res.data?.data || res.data);
    } catch {
      alert("Failed to load booking");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !booking) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: "center", alignItems: "center" }} />;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{booking.occasion}</Text>
      <Text style={styles.boatName}>{booking.boatName}</Text>
      <Text>Status: {booking.paymentStatus}</Text>
      <Text>Guests: {booking.numberOfGuest}</Text>
      <Text>
        Date: {new Date(booking.startDate).toLocaleString()} -{" "}
        {new Date(booking.endDate).toLocaleString()}
      </Text>
      {booking.specialRequest && <Text>Special Request: {booking.specialRequest}</Text>}

      {booking.images?.length > 0 && (
        <ScrollView horizontal style={{ marginTop: 16 }}>
          {booking.images.map((img: string, index: number) => (
            <Image
              key={index}
              source={{ uri: img }}
              style={{ width: 250, height: 150, marginRight: 12, borderRadius: 12 }}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: "700" },
  boatName: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
});
