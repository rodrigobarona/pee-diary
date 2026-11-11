import { render, screen } from "@testing-library/react-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

// Renders a NativeWind-styled component so the Jest setup is exercised on
// the styling stack, not only on the store.
describe("Button", () => {
  it("renders its label", () => {
    render(
      <Button>
        <Text>Save</Text>
      </Button>
    );
    expect(screen.getByText("Save")).toBeTruthy();
  });

  it("is disabled when asked", () => {
    render(
      <Button disabled>
        <Text>Save</Text>
      </Button>
    );
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
