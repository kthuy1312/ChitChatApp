import mongoose from "mongoose"

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
        index: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    content: {
        type: String,
        trim: true
    },
    imgUrl: {
        type: String
    },
    isForwarded: {
        type: Boolean,
        default: false
    },
    //để lấy nội dung tn gốc
    originalMessageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: null
    },
    //thu hồi tn
    isUnsent: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

//index ket hop COMPOUND INDEX 
messageSchema.index({ conversationId: 1, createdAt: -1 })
//(1:sx theo tang dan, -1 giam dan) 
// => conversationI : 1 - dung gom nhom
// => createdAt: -1 - tn moi nhat nam tren cung

const Message = mongoose.model("Message", messageSchema)
export default Message;