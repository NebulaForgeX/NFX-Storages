import { Select } from "@radix-ui/themes";

import { useBuckets } from "@/hooks";

interface BucketSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function BucketSelect({ value, onChange, placeholder }: BucketSelectProps) {
  const { data = [] } = useBuckets();

  return (
    <Select.Root value={value || undefined} onValueChange={onChange}>
      <Select.Trigger placeholder={placeholder} />
      <Select.Content>
        {data.map((item) => (
          <Select.Item key={item.Name} value={item.Name}>
            {item.Name}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}
