import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export function Settings() {
  const { success, error, info, warning, loading, promise } = useToast();

  const handleSuccessToast = () => {
    success(
      "Settings saved!",
      "Your preferences have been updated successfully."
    );
  };

  const handleErrorToast = () => {
    error("Something went wrong", "Failed to save settings. Please try again.");
  };

  const handleInfoToast = () => {
    info("Information", "This is an informational message.");
  };

  const handleWarningToast = () => {
    warning("Warning", "Please check your input before proceeding.");
  };

  const handleLoadingToast = () => {
    loading("Saving settings...");
    // Simulate async operation
    setTimeout(() => {
      success("Settings saved!", "Your preferences have been updated.");
    }, 2000);
  };

  const handlePromiseToast = () => {
    const mockApiCall = new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.5) {
          resolve("Success!");
        } else {
          reject("Failed!");
        }
      }, 2000);
    });

    promise(mockApiCall, {
      loading: "Updating settings...",
      success: "Settings updated successfully!",
      error: "Failed to update settings",
    });
  };

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Toast Examples</h3>
        <p className="text-muted-foreground">
          Click the buttons below to see different types of toast notifications:
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Button onClick={handleSuccessToast} variant="default">
            Success Toast
          </Button>

          <Button onClick={handleErrorToast} variant="destructive">
            Error Toast
          </Button>

          <Button onClick={handleInfoToast} variant="secondary">
            Info Toast
          </Button>

          <Button onClick={handleWarningToast} variant="outline">
            Warning Toast
          </Button>

          <Button onClick={handleLoadingToast} variant="secondary">
            Loading Toast
          </Button>

          <Button onClick={handlePromiseToast} variant="outline">
            Promise Toast
          </Button>
        </div>
      </div>
    </div>
  );
}
