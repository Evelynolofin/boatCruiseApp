import { useState, useEffect, useMemo } from "react";
import { httpClient } from "@/constants/httpClient";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Modal from "react-native-modal";

interface Booking {
  _id: string;
  boatId: string;
  boatName?: string;
  startDate: string;
  endDate: string;
  numberOfGuest: number;
  occasion: string;
  specialRequest?: string;
  paymentStatus?: string; 
  paymentReference?: string;
  amount?: number;
  location?: string;
  refund?: {
    amount: number;
    percentage: number;
  };
}

type TabType = "upcoming" | "past";
type StatusTabType = "all" | "paid" | "pending" | "cancelled";

export default function BookingDetails() {
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");
  const [statusTab, setStatusTab] = useState<StatusTabType>("all");
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  const now = new Date();
  const ONE_HOUR = 60 * 60 * 1000;

  const getMyBookings = async () => {
    try {
      setLoadingBookings(true);
      const res = await httpClient.get("/bookings");
      const bookings: Booking[] = res.data?.data || res.data?.bookings || res.data || [];
      setMyBookings(bookings);
    } catch (err: any) {
      Alert.alert("Error", "Failed to load bookings");
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    getMyBookings();
  }, []);

  const refreshBookings = async () => {
    setRefreshing(true);
    await getMyBookings();
    setRefreshing(false);
  };

  const upcomingBookings = useMemo(() => {
    return myBookings.filter((b) => {
      const endTime = new Date(b.endDate).getTime();
      const startTime = new Date(b.startDate).getTime();
      const isPaid = b.paymentStatus === "success" || b.paymentStatus === "paid";

      if (isPaid && endTime > now.getTime()) return true;
      if (!isPaid && now.getTime() - startTime <= ONE_HOUR) return true;
      return false;
    });
  }, [myBookings]);

  const pastBookings = useMemo(() => {
    return myBookings.filter((b) => {
      const endTime = new Date(b.endDate).getTime();
      const startTime = new Date(b.startDate).getTime();
      const isPaid = b.paymentStatus === "success" || b.paymentStatus === "paid";

      if (isPaid && endTime <= now.getTime()) return true;
      if (!isPaid && now.getTime() - startTime > ONE_HOUR) return true;
      return false;
    });
  }, [myBookings]);

  const filteredBookings = useMemo(() => {
    const list = activeTab === "upcoming" ? upcomingBookings : pastBookings;
    if (statusTab === "all") return list;
    return list.filter((b) => b.paymentStatus === statusTab);
  }, [activeTab, statusTab, upcomingBookings, pastBookings]);

  const getBookingById = async (bookingId: string) => {
    try {
      setLoadingBookings(true);
      const res = await httpClient.get(`/bookings/${bookingId}`);
      setCurrentBooking(res.data?.data || res.data);
      setDetailsModalVisible(true);
    } catch {
      Alert.alert("Error", "Failed to load booking details");
    } finally {
      setLoadingBookings(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    Alert.alert("Cancel Booking", "Are you sure?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          try {
            const res = await httpClient.patch(`/bookings/${bookingId}/cancel`);
            const updatedBooking = res.data?.data?.booking;
            const updatedPaymentStatus = updatedBooking?.status?.toLowerCase() || "cancelled";

            setMyBookings((prev) =>
              prev.map((b) =>
                b._id === bookingId
                  ? { ...b, paymentStatus: updatedPaymentStatus, refund: res.data?.data?.refund }
                  : b
              )
            );

            if (currentBooking?._id === bookingId) {
              setCurrentBooking((prev) =>
                prev
                  ? { ...prev, paymentStatus: updatedPaymentStatus, refund: res.data?.data?.refund }
                  : prev
              );
            }

            Alert.alert("Success", res.data?.message || "Booking cancelled successfully");
          } catch {
            Alert.alert("Error", "Cancellation failed");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />
      <Text style={styles.headerTitle}>My Bookings</Text>

      <View style={styles.tabsContainer}>
        {["upcoming", "past"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab as TabType)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.toUpperCase()} ({tab === "upcoming" ? upcomingBookings.length : pastBookings.length})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statusTabsContainer}>
        {["all", "paid", "pending", "cancelled"].map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.statusTab, statusTab === status && styles.activeStatusTab]}
            onPress={() => setStatusTab(status as StatusTabType)}
          >
            <Text style={[styles.statusTabText, statusTab === status && styles.activeStatusTabText]}>
              {status.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loadingBookings && myBookings.length === 0 ? (
        <ActivityIndicator size="large" />
      ) : filteredBookings.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No {activeTab} bookings for "{statusTab}" status
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshBookings} />}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onViewDetails={() => getBookingById(item._id)}
              onCancel={() => cancelBooking(item._id)}
            />
          )}
        />
      )}

      <Modal
        isVisible={detailsModalVisible}
        onBackdropPress={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Booking Details</Text>
          {currentBooking && (
            <>
              <Text>Boat: {currentBooking.boatName}</Text>
              <Text>Guests: {currentBooking.numberOfGuest}</Text>
              <Text>Status: {currentBooking.paymentStatus}</Text>
              <Text>
                Date: {new Date(currentBooking.startDate).toLocaleString()} -{" "}
                {new Date(currentBooking.endDate).toLocaleString()}
              </Text>
              {currentBooking.specialRequest && <Text>Special Request: {currentBooking.specialRequest}</Text>}

              {currentBooking.paymentStatus === "cancelled" && currentBooking.refund && (
                <Text style={{ color: "#10B981", marginTop: 8 }}>
                  Refund: ₦{currentBooking.refund.amount} ({currentBooking.refund.percentage}%)
                </Text>
              )}

              {currentBooking.paymentStatus === "success" && (
                <TouchableOpacity
                  onPress={() => cancelBooking(currentBooking._id)}
                  style={[styles.cancelBtn, { marginTop: 12 }]}
                >
                  <Text style={styles.cancelText}>Cancel Booking</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          <TouchableOpacity
            onPress={() => setDetailsModalVisible(false)}
            style={styles.modalClose}
          >
            <Text style={{ color: "red" }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const BookingCard = ({
  booking,
  onViewDetails,
  onCancel,
}: {
  booking: Booking;
  onViewDetails: () => void;
  onCancel: () => void;
}) => (
  <View style={styles.bookingCard}>
    <Text style={styles.occasion}>{booking.occasion}</Text>
    <Text>{booking.boatName}</Text>
    <Text>
      {new Date(booking.startDate).toLocaleDateString()} •{" "}
      {new Date(booking.startDate).toLocaleTimeString()} -{" "}
      {new Date(booking.endDate).toLocaleTimeString()}
    </Text>
    <Text>Status: {booking.paymentStatus}</Text>

    <View style={styles.actions}>
      <TouchableOpacity style={styles.viewBtn} onPress={onViewDetails}>
        <Text style={styles.viewBtnText}>View Details</Text>
      </TouchableOpacity>

      {booking.paymentStatus === "success" && (
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel Booking</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);


const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F8F8F8" 
  },
  headerTitle: {
    fontSize: 22, 
    fontWeight: "700", 
    padding: 16 
  },
  tabsContainer: {
    flexDirection: "row", 
    backgroundColor: "#EFEFEF", 
    marginHorizontal: 16, 
    borderRadius: 24, 
    padding: 4 
  },
  tab: { 
    flex: 1, 
    paddingVertical: 10, 
    alignItems: "center", 
    borderRadius: 20 
  },
  activeTab: { 
    backgroundColor: "#FFF" 
  },
  tabText: { 
    color: "#777", 
    fontWeight: "600" 
  },
  activeTabText: { 
    color: "#000" 
  },
  statusTabsContainer: { 
    flexDirection: "row", 
    marginHorizontal: 16, 
    marginTop: 8, 
    marginBottom: 16 
  },
  statusTab: { 
    flex: 1, 
    paddingVertical: 6, 
    marginHorizontal: 4, 
    borderRadius: 12, 
    backgroundColor: "#EEE", 
    alignItems: "center" 
  },
  activeStatusTab: { 
    backgroundColor: "#000" 
  },
  statusTabText: { 
    color: "#555", 
    fontWeight: "600" 
  },
  activeStatusTabText: { 
    color: "#FFF" 
  },
  bookingCard: { 
    backgroundColor: "#FFF", 
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 16, 
    elevation: 3 
  },
  occasion: { 
    fontSize: 16, 
    fontWeight: "700" 
  },
  actions: { 
    flexDirection: "row", 
    marginTop: 12, 
    gap: 8 
  },
  viewBtn: { 
    flex: 1, 
    backgroundColor: "#000", 
    padding: 10, 
    borderRadius: 8, 
    alignItems: "center" 
  },
  viewBtnText: { 
    color: "#FFF" 
  },
  cancelBtn: { 
    flex: 1, 
    backgroundColor: "#FFE5E5", 
    padding: 10, 
    borderRadius: 8, 
    alignItems: "center" 
  },
  cancelText: { 
    color: "red" 
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  emptyText: { 
    color: "#666" 
  },
  modalContainer: { 
    backgroundColor: "#FFF", 
    borderRadius: 12, 
    padding: 20 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    marginBottom: 12 
  },
  modalClose: { 
    marginTop: 20, 
    alignSelf: "flex-end"
  },
});
