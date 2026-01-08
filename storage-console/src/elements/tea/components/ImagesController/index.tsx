import type { TeaFormValues } from "../../controllers/teaSchema";
import type { TeaImageEditable } from "@/apis/domain";

import { memo } from "react";
import { Controller, useFormContext } from "react-hook-form";

import TeaImageUploader from "../TeaImageUploader";

const ImagesController = memo(() => {
  const { control } = useFormContext<TeaFormValues>();

  return (
    <Controller<TeaFormValues>
      control={control}
      name="Images"
      render={({ field, fieldState: { error } }) => (
        <TeaImageUploader
          images={(field.value as TeaImageEditable[]) || []}
          onChange={field.onChange}
          maxImages={10}
          error={error?.message}
        />
      )}
    />
  );
});

ImagesController.displayName = "ImagesController";

export default ImagesController;

