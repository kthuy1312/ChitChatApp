import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";
import { UserPlus, Plus } from "lucide-react";
import type { User } from "@/types/user";
import { useFriendStore } from "@/stores/useFriendStore";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import SearchForm from "../addFriendModal/SearchForm";
import SendFriendRequestForm from "../addFriendModal/SendFriendRequestForm";

export interface IFormValues {
    username: string;
    message: string;
}

const AddFriendModal = () => {
    const [isFound, setIsFound] = useState<boolean | null>(null);
    const [searchUser, setSearchUser] = useState<User>();
    const [searchedUsername, setSearchedUsername] = useState("");
    const { loading, searchByUsername, addFriend } = useFriendStore();

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<IFormValues>({
        defaultValues: { username: "", message: "" },
    });

    const usernameValue = watch("username");

    //user đang gõ lại -> reset trạng thái tìm kiếm cũ
    useEffect(() => {
        if (!usernameValue?.trim()) {
            setIsFound(null);
            setSearchedUsername("");
            setSearchUser(undefined);
        } else {
            setIsFound(null);
        }
    }, [usernameValue]);

    const handleSearch = handleSubmit(async (data) => {
        const username = data.username.trim();
        if (!username) return;

        setIsFound(null);
        setSearchedUsername(username);

        try {
            const foundUser = await searchByUsername(username);
            if (foundUser) {
                setIsFound(true);
                setSearchUser(foundUser);
            } else {
                setIsFound(false);
            }
        } catch (error) {
            console.error(error);
            setIsFound(false);
        }
    });

    const handleSend = handleSubmit(async (data) => {
        if (!searchUser) return;

        const res = await addFriend(searchUser._id, data.message.trim());

        if (res.success) {
            toast.success(res.message);
            handleCancel();
        } else {
            toast.error(res.message);
        }
    });

    const handleCancel = () => {
        reset();
        setSearchedUsername("");
        setIsFound(null);
    };

    const handleBack = () => {
        reset({ message: "" });
        setIsFound(null);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="flex justify-center items-center size-5 rounded-full hover:bg-sidebar-accent cursor-pointer z-10">
                    <Plus className="size-4" />
                    <span className="sr-only">Kết bạn</span>
                </div>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px] border-none">
                <DialogHeader>
                    <DialogTitle>Kết Bạn</DialogTitle>
                </DialogHeader>

                {!isFound && (
                    <>
                        <SearchForm
                            register={register}
                            errors={errors}
                            usernameValue={usernameValue}
                            loading={loading}
                            isFound={isFound}
                            searchedUsername={searchedUsername}
                            onSubmit={handleSearch}
                            onCancel={handleCancel}
                        />
                    </>
                )}

                {isFound && (
                    <>
                        <SendFriendRequestForm
                            register={register}
                            loading={loading}
                            searchedUsername={searchedUsername}
                            onSubmit={handleSend}
                            onBack={handleBack}
                        />
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default AddFriendModal;