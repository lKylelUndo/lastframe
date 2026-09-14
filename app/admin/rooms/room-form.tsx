"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRoomSchema, type CreateRoomInput } from "@/lib/validations";
import { createRoom } from "@/actions/rooms";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function RoomForm() {
  const [state, formAction, pending] = useActionState(createRoom, null);
  const router = useRouter();

  const form = useForm<CreateRoomInput>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (state && "success" in state) {
      form.reset();
      router.refresh();
    }
  }, [state, router, form]);

  function onSubmit(data: CreateRoomInput) {
    const formData = new FormData();
    formData.set("name", data.name);
    formAction(formData);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 rounded-lg border border-border p-4"
      >
        <h3>Create Room</h3>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Room Name</FormLabel>
              <FormControl>
                <Input placeholder="Room name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {state && "error" in state && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <Button type="submit" disabled={pending} className="h-10">
          {pending ? "Creating..." : "Create Room"}
        </Button>
      </form>
    </Form>
  );
}
