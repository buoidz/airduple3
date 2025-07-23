import {
  HStack,
  Icon,
  Input,
  InputGroup,
} from "@chakra-ui/react";
import { SearchIcon } from "lucide-react";

const Filter = ({ columnFilters, setColumnFilters }) => {
  const taskName = columnFilters.find((f) => f.id === "task")?.value || "";
   

  const onFilterChange = (id, value) =>
    setColumnFilters((prev) =>
      prev
        .filter((f) => f.id !== id)
        .concat({
          id,
          value,
        })
    );

  return (
    <HStack mb={6}>
      <InputGroup maxW="12rem">
        <Input
          type="text"
          placeholder="Task name"
          borderRadius={5}
          value={taskName}
          onChange={(e) => onFilterChange("task", e.target.value)}
        />
      </InputGroup>
      {/* <FilterPopover
        columnFilters={columnFilters}
        setColumnFilters={setColumnFilters}
      /> */}
    </HStack>
  );
};
export default Filter;