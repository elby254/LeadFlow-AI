import AfricasTalking from "africastalking";
import { normalizeKenyanNumber } from "../utils/phoneUtils.js";

const africastalking = AfricasTalking({
  apiKey: process.env.AT_API_KEY,
  username: process.env.AT_USERNAME,
});

const sms = africastalking.SMS;

/**
 * Send SMS (core AT integration)
 */
export const sendSMS = async (phone, message) => {
  try {
    const cleanPhone = normalizeKenyanNumber(phone);

    console.log("📡 Sending SMS:", cleanPhone, message);
    console.log("📡 SMS PAYLOAD:", {
      to: [cleanPhone],
      message,
    });

    console.log("AT_USERNAME:", process.env.AT_USERNAME);

    console.log("PAYLOAD:", {
      to: [cleanPhone],
      message,
      from: process.env.AT_SENDER_ID,
    });

    const result = await sms.send({
      to: [cleanPhone],
      message,
      from: process.env.AT_SENDER_ID,
    });

    console.log("📡 SMS API RESPONSE:", result);

    return result;
  } catch (error) {
    console.error("❌ Africa's Talking SMS error:", error);
    throw error;
  }
};