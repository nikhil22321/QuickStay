import transporter from "../configs/nodemailer.js";
import Booking from "../models/Booking.js";
import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";

// Function to Check Availability of Room
const checkAvailability = async ({ checkInDate, checkOutDate, room }) => {
  try {
    const bookings = await Booking.find({
      room,
      checkInDate: { $lte: checkOutDate },
      checkOutDate: { $gte: checkInDate },
    });

    return bookings.length === 0;
  } catch (error) {
    console.error("Availability check failed:", error.message);
    return false;
  }
};

// ✅ API: Check Room Availability
export const checkAvailabilityAPI = async (req, res) => {
  try {
    const { room, checkInDate, checkOutDate } = req.body;

    if (!room || !checkInDate || !checkOutDate) {
      return res.status(400).json({ success: false, message: "Missing parameters" });
    }

    const isAvailable = await checkAvailability({ checkInDate, checkOutDate, room });
    return res.json({ success: true, isAvailable });
  } catch (error) {
    console.error("Error in checkAvailabilityAPI:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ API: Create Booking
export const createBooking = async (req, res) => {
  try {
    const { room, checkInDate, checkOutDate, guests } = req.body;
    const user = req.user._id;

    const isAvailable = await checkAvailability({ checkInDate, checkOutDate, room });

    if (!isAvailable) {
      return res.json({ success: false, message: "Room is not available" });
    }

    const roomData = await Room.findById(room).populate("hotel");
    if (!roomData) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const totalPrice = roomData.pricePerNight * nights;

    const booking = await Booking.create({
      user,
      room,
      hotel: roomData.hotel._id,
      guests: +guests,
      checkInDate,
      checkOutDate,
      totalPrice,
    });

    // ✉️ Send confirmation email
    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: req.user.email,
      subject: "Booking Confirmation",
      html: `
        <h1>Booking Confirmation</h1>
        <p>Dear ${req.user.name},</p>
        <p>Your booking has been confirmed.</p>
        <h2>Booking Details</h2>
        <ul>
          <li><strong>Booking ID:</strong> ${booking._id}</li>
          <li><strong>Hotel:</strong> ${roomData.hotel.name}</li>
          <li><strong>Room:</strong> ${roomData.name}</li>
          <li><strong>Guests:</strong> ${guests}</li>
          <li><strong>Check-in:</strong> ${new Date(checkInDate).toDateString()}</li>
          <li><strong>Check-out:</strong> ${new Date(checkOutDate).toDateString()}</li>
          <li><strong>Total:</strong> ${process.env.CURRENCY || '$'}${totalPrice}</li>
        </ul>
        <p>We look forward to hosting you!</p>
      `,
    };

    await transporter.sendMail(mailOptions); // ✅ PASS mailOptions

    res.json({ success: true, message: "Booking created successfully" });
  } catch (error) {
    console.error("Error in createBooking:", error);
    res.status(500).json({ success: false, message: "Failed to create booking" });
  }
};

// ✅ API: Get User Bookings
export const getUserBookings = async (req, res) => {
  try {
    const user = req.user._id;
    const bookings = await Booking.find({ user })
      .populate("room hotel")
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    console.error("Error in getUserBookings:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch bookings" });
  }
};

// ✅ API: Get Hotel Bookings for Owner
export const getHotelBookings = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ owner: req.auth.userId });
    if (!hotel) {
      return res.json({ success: false, message: "No Hotel found" });
    }

    const bookings = await Booking.find({ hotel: hotel._id })
      .populate("room hotel user")
      .sort({ createdAt: -1 });

    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((acc, booking) => acc + booking.totalPrice, 0);

    res.json({ success: true, dashboardData: { totalBookings, totalRevenue, bookings } });
  } catch (error) {
    console.error("Error in getHotelBookings:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch bookings" });
  }
};
