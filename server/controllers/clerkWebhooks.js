import User from "../models/User.js";
import { Webhook } from "svix";

const clerkWebhooks = async (req, res) => {
  try {
    // Step 1: Validate required Svix headers
    const svixHeaders = {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    };

    if (!svixHeaders["svix-id"] || !svixHeaders["svix-timestamp"] || !svixHeaders["svix-signature"]) {
      return res.status(400).json({ success: false, message: "Missing required Svix headers" });
    }

    // Step 2: Verify webhook using Svix
    const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
    const payload = JSON.stringify(req.body);
    webhook.verify(payload, svixHeaders);

    // Step 3: Extract data and type from Clerk event
    const { data, type } = req.body;

    if (!data || !type) {
      return res.status(400).json({ success: false, message: "Invalid Clerk webhook payload" });
    }

    // Step 4: Process webhook event types
    switch (type) {
      case "user.created":
        {
          const userData = {
            _id: data.id,
            email: data.email_addresses?.[0]?.email_address || "",
            username: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
            image: data.image_url || "",
          };
          await User.create(userData);
        }
        break;

      case "user.updated":
        {
          const userData = {
            _id: data.id,
            email: data.email_addresses?.[0]?.email_address || "",
            username: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
            image: data.image_url || "",
          };
          await User.findByIdAndUpdate(data.id, userData);
        }
        break;

      case "user.deleted":
        await User.findByIdAndDelete(data.id);
        break;

      default:
        console.log(`Unhandled Clerk webhook event type: ${type}`);
        break;
    }

    return res.status(200).json({ success: true, message: "Webhook received and processed" });
  } catch (error) {
    console.error("Webhook Error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default clerkWebhooks;
