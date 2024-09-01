import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { UnlistenFn } from "@tauri-apps/api/event";
import {
  Flex,
  Theme,
  Text,
  Button,
  Grid,
  SegmentedControl,
  Card,
  Separator,
  Slider,
  TextField,
  Box,
  Switch,
  Badge,
  DataList,
  BadgeProps,
  Checkbox,
} from "@radix-ui/themes";
import { HashIcon, LightbulbIcon, ShuffleIcon } from "lucide-react";
import "@radix-ui/themes/styles.css";
import "./App.css";
import { isDigit, isLetter, timeToCrackPassword, useCopy } from "./utils";

export const useTheme = () => {
  const [theme, setTheme] = useState<"light" | "dark" | "inherit">("inherit");

  useEffect(() => {
    let unlisten: UnlistenFn | undefined;

    (async () => {
      setTheme((await getCurrentWindow().theme()) || "inherit");

      unlisten = await getCurrentWindow().onThemeChanged(
        ({ payload: theme }) => {
          console.log(`theme changed to ${theme}`);
          setTheme(theme);
        }
      );
    })();

    return () => {
      if (unlisten != null) {
        unlisten();
      }
    };
  }, []);

  return theme;
};

function App() {
  const [passwordType, setPasswordType] = useState("random");
  const [randomLength, setRandomLength] = useState(20);
  const [randomSymbols, setRandomSymbols] = useState(false);
  const [randomNumbers, setRandomNumbers] = useState(true);
  const [randomUppercase, setRandomUppercase] = useState(true);
  const [memorableLength, setMemorableLength] = useState(4);
  const [memorableUseFullWords, setMemorableUseFullWords] = useState(true);
  const [memorableCapitalizeFirstLetter, setMemorableCapitalizeFirstLetter] =
    useState(false);
  const [memorableUppercase, setMemorableUppercase] = useState(false);
  const [memorableSeparator, setMemorableSeparator] = useState("-");
  const [pinLength, setPinLength] = useState(6);
  const [strength, setStrength] = useState("");
  const [strengthColor, setStrengthColor] =
    useState<BadgeProps["color"]>(undefined);
  const [crackTime, setCrackTime] = useState("");
  const [password, setPassword] = useState("");
  const [copyAsBase64String, setCopyAsBase64String] = useState(false);

  const theme = useTheme();
  const { isCopied, copyToClipboard, resetCopyStatus } = useCopy();

  const divRef = useRef<HTMLDivElement>(null);

  async function random_password() {
    const pass: string = await invoke("gen_password", {
      length: randomLength,
      symbols: randomSymbols,
      numbers: randomNumbers,
      uppercase: randomUppercase,
    });
    setPassword(pass as string);

    const score: number = await invoke("score", { password: pass });
    if (score >= 0 && score < 20) {
      setStrength("VERY DANGEROUS");
    } else if (score >= 20 && score < 40) {
      setStrength("DANGEROUS");
    } else if (score >= 40 && score < 60) {
      setStrength("VERY WEAK");
    } else if (score >= 60 && score < 80) {
      setStrength("WEAK");
    } else if (score >= 80 && score < 90) {
      setStrength("GOOD");
      setStrengthColor("green");
    } else if (score >= 90 && score < 95) {
      setStrength("STRONG");
    } else if (score >= 95 && score < 99) {
      setStrength("VERY STRONG");
    } else if (score >= 99 && score <= 100) {
      setStrength("INVULNERABLE");
    }

    if (score >= 0 && score < 40) {
      setStrengthColor("red");
    } else if (score >= 40 && score < 60) {
      setStrengthColor("orange");
    } else if (score >= 60 && score < 80) {
      setStrengthColor("yellow");
    } else if (score >= 80 && score <= 100) {
      setStrengthColor("green");
    } else {
      setStrengthColor(undefined);
    }

    setCrackTime(timeToCrackPassword(pass));
    resetCopyStatus();
  }

  async function gen_words() {
    const words: string[] = await invoke("gen_words", {
      length: memorableLength,
      fullWords: memorableUseFullWords,
    });
    let pass = words
      .map((w) =>
        memorableUppercase
          ? w.toUpperCase()
          : memorableCapitalizeFirstLetter
          ? w.charAt(0).toUpperCase() + w.slice(1)
          : w
      )
      .join(memorableSeparator === "" ? " " : memorableSeparator);
    setPassword(pass);
    resetCopyStatus();
  }

  async function pin() {
    const pass: string = await invoke("gen_pin", {
      length: pinLength,
    });
    setPassword(pass);
    resetCopyStatus();
  }

  async function setWindowHeight() {
    if (divRef.current) {
      await getCurrentWindow().setSize(
        new LogicalSize(480, divRef.current.clientHeight)
      );
    }
  }

  useEffect(() => {
    random_password();
  }, [randomLength, randomNumbers, randomSymbols, randomUppercase]);

  useEffect(() => {
    gen_words();
  }, [
    memorableLength,
    memorableCapitalizeFirstLetter,
    memorableUppercase,
    memorableUseFullWords,
    memorableSeparator,
  ]);

  useEffect(() => {
    pin();
  }, [pinLength]);

  const copy = async () => {
    await copyToClipboard(copyAsBase64String ? btoa(password) : password);
  };

  useEffect(() => {
    if (passwordType === "random") {
      random_password();
    } else if (passwordType === "memorable") {
      gen_words();
    } else if (passwordType === "pin") {
      pin();
    }
    setWindowHeight();
  }, [passwordType]);

  return (
    <Theme appearance={theme}>
      <Flex
        data-tauri-drag-region
        direction="column"
        gap="2"
        px="5"
        pt="8"
        pb="3"
        ref={divRef}
      >
        <Text style={{ fontWeight: "bold" }} data-tauri-drag-region>
          Choose a password type
        </Text>
        <SegmentedControl.Root
          value={passwordType}
          my="4"
          radius="large"
          onValueChange={setPasswordType}
        >
          <SegmentedControl.Item value="random">
            <Flex gap="2" align="center">
              <ShuffleIcon size={16} />
              Random
            </Flex>
          </SegmentedControl.Item>
          <SegmentedControl.Item value="memorable">
            <Flex gap="2" align="center">
              <LightbulbIcon size={16} />
              Memorable
            </Flex>
          </SegmentedControl.Item>
          <SegmentedControl.Item value="pin">
            <Flex gap="2" align="center">
              <HashIcon size={16} />
              PIN
            </Flex>
          </SegmentedControl.Item>
        </SegmentedControl.Root>
        <Text style={{ fontWeight: "bold" }} data-tauri-drag-region>
          Customize your password
        </Text>
        {passwordType === "random" ? (
          <Flex my="4" direction="column" gap="4">
            <Separator size="4" />

            <Flex gap="4" align="center">
              <Text color="gray">Characters</Text>
              <Slider
                value={[randomLength]}
                onValueChange={(values) => setRandomLength(values[0])}
                min={4}
                max={100}
              />
              <Box width="80px">
                <TextField.Root
                  size="2"
                  type="number"
                  min="4"
                  max="100"
                  value={randomLength}
                  readOnly
                />
              </Box>
            </Flex>
            <Separator size="4" />

            <Flex gap="4" align="center">
              <Text color="gray">Numbers</Text>
              <Switch
                checked={randomNumbers}
                onCheckedChange={setRandomNumbers}
              />
              <Text color="gray">Symbols</Text>
              <Switch
                checked={randomSymbols}
                onCheckedChange={setRandomSymbols}
              />
              <Text color="gray">Uppercase</Text>
              <Switch
                checked={randomUppercase}
                onCheckedChange={setRandomUppercase}
              />
            </Flex>
            <Separator size="4" />
          </Flex>
        ) : passwordType === "memorable" ? (
          <Flex my="4" direction="column" gap="4">
            <Separator size="4" />

            <Flex gap="4" align="center">
              <Text color="gray">Characters</Text>
              <Slider
                value={[memorableLength]}
                onValueChange={(values) => setMemorableLength(values[0])}
                min={3}
                max={15}
              />
              <Box width="80px">
                <TextField.Root
                  size="2"
                  type="number"
                  min="3"
                  max="15"
                  value={memorableLength}
                  readOnly
                />
              </Box>
            </Flex>
            <Separator size="4" />

            <Flex gap="4" align="center">
              <Text color="gray">Capitalize first letter</Text>
              <Switch
                checked={memorableCapitalizeFirstLetter}
                onCheckedChange={(checked) => {
                  setMemorableCapitalizeFirstLetter(checked);
                  if (checked) {
                    setMemorableUppercase(false);
                  }
                }}
              />
              <Text color="gray">Uppercase</Text>
              <Switch
                checked={memorableUppercase}
                onCheckedChange={(checked) => {
                  setMemorableUppercase(checked);
                  if (checked) {
                    setMemorableCapitalizeFirstLetter(false);
                  }
                }}
              />
            </Flex>

            <Separator size="4" />

            <Flex gap="4" align="center">
              <Text color="gray">Use full words</Text>
              <Switch
                checked={memorableUseFullWords}
                onCheckedChange={setMemorableUseFullWords}
              />
              <Text color="gray">Separator</Text>
              <Box width="50px">
                <TextField.Root
                  size="2"
                  maxLength={3}
                  value={memorableSeparator}
                  onChange={(e) => setMemorableSeparator(e.currentTarget.value)}
                />
              </Box>
            </Flex>
            <Separator size="4" />
          </Flex>
        ) : (
          <Flex my="4" direction="column" gap="4">
            <Separator size="4" />
            <Flex gap="4" align="center">
              <Text color="gray">Characters</Text>
              <Slider
                value={[pinLength]}
                onValueChange={(values) => setPinLength(values[0])}
                min={3}
                max={12}
              />
              <Box width="80px">
                <TextField.Root
                  size="2"
                  type="number"
                  min="3"
                  max="12"
                  value={pinLength}
                  readOnly
                />
              </Box>
            </Flex>
            <Separator size="4" />
          </Flex>
        )}
        <Text style={{ fontWeight: "bold" }} my="2" data-tauri-drag-region>
          Generated Password
        </Text>
        <Card>
          <Flex
            style={{ height: 100 }}
            align="center"
            justify="center"
            data-tauri-drag-region
          >
            <Flex wrap="wrap" align="center" justify="center">
              {[...password].map((char, i) =>
                char === " " ? (
                  <span key={i}>&nbsp;</span>
                ) : (
                  <Text
                    key={i}
                    size="4"
                    color={
                      isDigit(char)
                        ? "blue"
                        : isLetter(char)
                        ? undefined
                        : "orange"
                    }
                    style={{ fontWeight: "bold" }}
                  >
                    {char}
                  </Text>
                )
              )}
            </Flex>
          </Flex>
        </Card>
        {passwordType === "random" ? (
          <DataList.Root my="2">
            <DataList.Item>
              <DataList.Label>Your password strength:</DataList.Label>
              <DataList.Value>
                <Badge color={strengthColor}>{strength}</Badge>
              </DataList.Value>
            </DataList.Item>
            <DataList.Item>
              <DataList.Label>Estimated time to crack:</DataList.Label>
              <DataList.Value>{crackTime}</DataList.Value>
            </DataList.Item>
          </DataList.Root>
        ) : null}

        <Text as="label" size="2" mt="3">
          <Flex gap="2">
            <Checkbox
              checked={copyAsBase64String}
              onCheckedChange={(checked) => {
                console.log(checked);
                setCopyAsBase64String(checked as boolean);
              }}
            />
            Copy as BASE64 string
          </Flex>
        </Text>

        <Grid columns="2" gap="4" width="auto" my="4">
          <Button
            size="3"
            variant="solid"
            color={isCopied ? "green" : undefined}
            onClick={() => {
              copy();
            }}
          >
            {isCopied ? "Password Copied!" : "Copy Password"}
          </Button>
          <Button
            size="3"
            variant="outline"
            onClick={() => {
              passwordType === "random"
                ? random_password()
                : passwordType === "memorable"
                ? gen_words()
                : passwordType === "pin"
                ? pin()
                : null;
            }}
          >
            Refresh Password
          </Button>
        </Grid>
      </Flex>
    </Theme>
  );
}

export default App;
