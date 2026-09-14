"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createSubmission } from "@/actions/submissions";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select } from "@/components/ui/select";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

type Room = { id: string; name: string };

const submitSchema = z.object({
  roomId: z.string().min(1, "Room is required."),
});

type SubmitInput = z.infer<typeof submitSchema>;

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Only JPG, PNG, and WebP images are allowed.";
  }
  if (file.size > MAX_SIZE) {
    return "File must be under 10MB.";
  }
  return null;
}

export function SubmitForm({ rooms }: { rooms: Room[] }) {
  const [state, formAction, pending] = useActionState(createSubmission, null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const form = useForm<SubmitInput>({
    resolver: zodResolver(submitSchema),
    defaultValues: {
      roomId: "",
    },
  });

  useEffect(() => {
    if (state && "success" in state) {
      setPreview(null);
      setFile(null);
      setFileError(null);
      form.reset();
      fileInputRef.current && (fileInputRef.current.value = "");
      router.refresh();
    }
  }, [state, router, form]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) {
        const error = validateFile(f);
        setFileError(error);
        if (!error) {
          setFile(f);
          setPreview(URL.createObjectURL(f));
        } else {
          setFile(null);
          setPreview(null);
        }
      } else {
        setFile(null);
        setPreview(null);
        setFileError(null);
      }
    },
    []
  );

  function onSubmit(data: SubmitInput) {
    if (!file || fileError) {
      setFileError(fileError ?? "Image file is required.");
      return;
    }
    const formData = new FormData();
    formData.set("roomId", data.roomId);
    formData.set("file", file);
    formAction(formData);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="roomId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Room</FormLabel>
              <FormControl>
                <Select {...field}>
                  <option value="">Select a room</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-1.5">
          <label
            htmlFor="file"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Photo
          </label>
          <input
            ref={fileInputRef}
            id="file"
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={handleFileChange}
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors file:mr-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-primary/85 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
          />
          {fileError && (
            <p className="text-sm text-destructive">{fileError}</p>
          )}
        </div>

        {preview && (
          <div className="overflow-hidden rounded-lg border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="w-full max-h-64 object-contain"
            />
          </div>
        )}

        {state && "error" in state && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        {state && "success" in state && (
          <div className="rounded-lg border border-border p-4 text-center">
            <p className="text-sm font-medium">Submission uploaded.</p>
            <div className="mt-3 flex items-center justify-center gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setPreview(null);
                  setFile(null);
                  setFileError(null);
                  form.reset();
                  fileInputRef.current && (fileInputRef.current.value = "");
                  router.refresh();
                }}
              >
                Submit Another
              </Button>
              <a
                href={`/archive/${state.id}`}
                className={cn(buttonVariants({ variant: "ghost" }))}
              >
                View Record
              </a>
            </div>
          </div>
        )}

        {!(state && "success" in state) && (
          <Button type="submit" disabled={pending} className="h-10 w-full">
            {pending ? "Uploading..." : "Submit"}
          </Button>
        )}
      </form>
    </Form>
  );
}
