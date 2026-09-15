import { useQuery } from "@tanstack/react-query";

import { Select } from "@radix-ui/themes";

import { useStorageRepositories } from "@/hooks/storages";

interface BucketSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function BucketSelect({ value, onChange, placeholder }: BucketSelectProps) {
  const { buckets: bucketRepository } = useStorageRepositories();
  const { data = [] } = useQuery({
    queryKey: ["buckets"],
    queryFn: async () => {
      const response = await bucketRepository.listBuckets();
      return (response.Buckets ?? []).map((item) => item.Name).filter((name): name is string => Boolean(name));
    },
  });

  return (
    <Select.Root value={value || undefined} onValueChange={onChange}>
      <Select.Trigger placeholder={placeholder} />
      <Select.Content>
        {data.map((name) => (
          <Select.Item key={name} value={name}>
            {name}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}
