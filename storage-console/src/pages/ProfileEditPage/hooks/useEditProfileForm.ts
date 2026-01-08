import type { ProfileFormData } from "../controllers/profileSchema";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { useSelfProfile } from "@/hooks/useProfile";

import { ProfileSchema } from "../controllers/profileSchema";

export const useEditProfileForm = () => {
  const { data: profile } = useSelfProfile();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
    },
  });

  // Initialize form with current profile data
  useEffect(() => {
    if (profile) {
      form.reset({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
      });
    }
  }, [profile, form]);

  return form;
};
