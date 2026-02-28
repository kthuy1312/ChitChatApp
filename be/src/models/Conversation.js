import mongoose from "mongoose"

//dùng mô tả tt cơ bản của ng dùng trong cuộc trò ch
const participantSchema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    isRestricted: {
        type: Boolean,
        default: false
    },
}, {
    _id: false //kh tạo id riêng cho từng phần tử vì đây chri là 1 bảng phụ nên kh cần
})

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, {
    _id: false //kh tạo id riêng cho từng phần tử vì đây chỉ là 1 bảng phụ nên kh cần
})

//luu tt tin nhan cuoi cung (chứa thêm 1 vài tt thêm như ng gửi, tgian gửi)
const lastMessageSchema = new mongoose.Schema({
    _id: { type: String }, //kh phải _id của mongoose tạo mà là _id của tn message gốc
    content: {
        type: String,
        default: null
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    createdAt: {
        type: Date,
        default: null
    }
}, {
    _id: false
})

const conversationScheme = new mongoose.Schema({
    type: {
        type: String,
        enum: ['direct', 'group'],
        required: true
    },
    participants: {
        type: [participantSchema],
        required: true
    },
    group: {
        type: groupSchema
    },
    lastMessageAt: {
        type: Date
    },
    seenBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }], //1 mảng nha
    lastMessage: {
        type: lastMessageSchema,
        default: null
    },
    unreadCounts: {
        type: Map,
        of: Number,
        default: {}
    },

    // cho việc xóa conversation
    hiddenFor: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: []
    }],
    clearedAt: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
})

conversationScheme.index({
    "participants.userID": 1,
    lastMessageAt: -1,
})

const Conversation = mongoose.model("Conversation", conversationScheme)
export default Conversation
