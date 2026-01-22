import type { FieldErrors, UseFormRegister } from "react-hook-form";
import type { IFormValues } from "../chat/AddFriendModal";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { DialogFooter } from "../ui/dialog";
import { DialogClose } from "@radix-ui/react-dialog";
import { Button } from "../ui/button";
import { Search } from "lucide-react";

interface SearchFormProps {
  register: UseFormRegister<IFormValues>;
  errors: FieldErrors<IFormValues>;
  loading: boolean;
  usernameValue: string;
  isFound: boolean | null;
  searchedUsername: string;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

const SearchForm = ({
  register,
  errors,
  usernameValue,
  loading,
  isFound,
  searchedUsername,
  onSubmit,
  onCancel,
}: SearchFormProps) => {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label
          htmlFor="username"
          className="text-sm font-semibold"
        >
          Tìm bằng username
        </Label>

        <Input
          id="username"
          placeholder="Gõ tên username vào đây..."
          className={`
    glass border-border/50 transition-smooth
    focus:border-primary/50
    ${errors.username
              ? "border-destructive/40 focus:border-destructive/60 focus:ring-2 focus:ring-destructive/20"
              : ""
            }
  `}
          {...register("username", {
            required: "Username không được bỏ trống",
          })}
        />

        {errors.username && (
          <p className="mt-1 text-xs text-destructive/80">
            {errors.username.message}
          </p>
        )}


        {isFound === false && (
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <span className="flex size-5 items-center justify-center rounded-full bg-destructive/20 text-xs font-bold">
              !
            </span>
            <span>
              Không tìm thấy
              <span className="ml-1 font-semibold">@{searchedUsername}</span>
            </span>
          </div>
        )}


      </div>

      <DialogFooter>
        <DialogClose asChild>
          <Button
            type="button"
            variant="outline"
            className="flex-1 glass "
            onClick={onCancel}
          >
            Cancel
          </Button>
        </DialogClose>

        <Button
          type="submit"
          disabled={loading || !usernameValue?.trim()}
          className="flex-1 bg-gradient-chat text-white hover:opacity-90 transition-smooth"
        >
          {loading ? (
            <span>Đang tìm ...</span>
          ) : (
            <>
              <Search className="size-4 mr-2" /> Tìm
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default SearchForm;
