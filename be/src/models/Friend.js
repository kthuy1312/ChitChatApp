import mongoose from "mongoose"

const friendSchema = new mongoose.Schema({
    userA: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    userB: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

}, {
    timestamps: true
})

//truoc khi save phai chuan hoa  
//khi lưu vào db thì sẽ lưu userA luôn là ng có id nhỏ hơn truoc
friendSchema.pre("save", async function () {
    const a = this.userA.toString();
    const b = this.userB.toString();

    if (a > b) {
        this.userA = mongoose.Types.ObjectId(b);
        this.userB = mongoose.Types.ObjectId(a);
    }

});

friendSchema.index({
    userA: 1,
    userB: 1
}, {
    unique: true //1 cặp (userA, userB) chỉ được tồn tại DUY NHẤT 1 lần
})

const Friend = mongoose.model("Friend", friendSchema)
export default Friend