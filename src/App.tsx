import Calculator from "@/components/Calculator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCalculatorState } from "@/hooks/useCalculatorState";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GameVersion, gameVersions } from "@/types/game";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function App() {
  const { state, setState, resetState, changeVersion, flash } =
    useCalculatorState();
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    if (flash) {
      setIsFlashing(true);
      const timer = setTimeout(() => setIsFlashing(false), 150); // 애니메이션 시간
      return () => clearTimeout(timer);
    }
  }, [flash]);

  return (
    <div className="p-1 md:p-4 flex items-center justify-center w-screen">
      <Tabs defaultValue="ev" className="w-full max-w-2xl">
        <div
          className={cn(
            "relative rounded-[calc(theme(borderRadius.lg)-2px)] overflow-hidden transition-all duration-150",
            isFlashing &&
              "bg-white/20 shadow-[0_0_20px_rgba(255,255,255,0.3)] after:absolute after:inset-0 after:bg-white/20 after:pointer-events-none after:z-10"
          )}
        >
          <TabsList
            className="w-full gap-x-2 relative"
            style={{ outline: "1px solid white", outlineOffset: "-4px" }}
          >
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-x-2">
              <Select
                value={state.version}
                onValueChange={(value) => changeVersion(value as GameVersion)}
              >
                <SelectTrigger className="h-5 sm:w-[120px] w-[90px] border-[#999] text-white">
                  <SelectValue placeholder="Version" />
                </SelectTrigger>
                <SelectContent>
                  {gameVersions.map((version) => (
                    <SelectItem key={version} value={version}>
                      {version}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <TabsTrigger value="ev">DCSS Calculator</TabsTrigger>
            <button
              onClick={resetState}
              className="text-sm text-muted-foreground hover:text-foreground absolute right-8"
            >
              <span className="hidden md:block">Reset to Default</span>
              <span className="block md:hidden">Reset</span>
            </button>
          </TabsList>
          <TabsContent value="ev">
            <Calculator state={state} setState={setState} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

export default App;
