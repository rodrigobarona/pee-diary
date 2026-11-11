import { render, screen } from "@testing-library/react-native";

import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";

// Smoke test: a component written with className renders under Jest.
// NativeWind does not compile styles in Jest, so no style is asserted here.
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
