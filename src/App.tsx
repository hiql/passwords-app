import { ReactNode, useEffect, useState } from "react";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { readText } from "@tauri-apps/plugin-clipboard-manager";
import useResizeObserver from "use-resize-observer";
import {
  Flex,
  Theme,
  Text,
  Button,
  Slider,
  TextField,
  Box,
  Badge,
  BadgeProps,
  Tabs,
  RadioCards,
  TextArea,
  IconButton,
  Checkbox,
  RadioGroup,
  Spinner,
  Table,
  ButtonProps,
  ThemeProps,
  Tooltip,
  Strong,
} from "@radix-ui/themes";
import {
  ButtonIcon,
  CheckIcon,
  ClipboardIcon,
  CodeIcon,
  CopyIcon,
  EraserIcon,
  LetterCaseCapitalizeIcon,
  LightningBoltIcon,
  MagicWandIcon,
  QuestionMarkCircledIcon,
  ReaderIcon,
  ShuffleIcon,
  UpdateIcon,
} from "@radix-ui/react-icons";
import "@radix-ui/themes/styles.css";
import "./App.css";
import { isDigit, isLetter } from "./utils";
import {
  useCopy,
  useDebounce,
  useHover,
  useLocalStorage,
  useTheme,
} from "./hooks";
import natives, { AnalyzedResult } from "./natives";

const ACCENT_COLOR_KEY = "passwords-app-accent-color";
const DEFAULT_ACCENT_COLOR = "indigo";
const COLORS: ButtonProps["color"][] = [
  "gray",
  "gold",
  "bronze",
  "brown",
  "yellow",
  "amber",
  "orange",
  "tomato",
  "red",
  "ruby",
  "crimson",
  "pink",
  "plum",
  "purple",
  "violet",
  "iris",
  "indigo",
  "blue",
  "cyan",
  "teal",
  "jade",
  "green",
  "grass",
  "lime",
  "mint",
  "sky",
];

const getStrengthString = (score: number): string => {
  if (score >= 0 && score < 20) {
    return "VERY DANGEROUS";
  } else if (score >= 20 && score < 40) {
    return "DANGEROUS";
  } else if (score >= 40 && score < 60) {
    return "VERY WEAK";
  } else if (score >= 60 && score < 80) {
    return "WEAK";
  } else if (score >= 80 && score < 90) {
    return "GOOD";
  } else if (score >= 90 && score < 95) {
    return "STRONG";
  } else if (score >= 95 && score < 99) {
    return "VERY STRONG";
  } else if (score >= 99 && score <= 100) {
    return "INVULNERABLE";
  } else return "";
};

const getStrengthColor = (score: number): BadgeProps["color"] | undefined => {
  if (score >= 0 && score < 40) {
    return "red";
  } else if (score >= 40 && score < 60) {
    return "orange";
  } else if (score >= 60 && score < 80) {
    return "yellow";
  } else if (score >= 80 && score <= 100) {
    return "green";
  } else {
    return undefined;
  }
};

function App() {
  const [panelType, setPanelType] = useState("generator");
  const [passwordType, setPasswordType] = useState("random");
  const [randomLength, setRandomLength] = useState(20);
  const [randomSymbols, setRandomSymbols] = useState(false);
  const [randomNumbers, setRandomNumbers] = useState(true);
  const [randomUppercase, setRandomUppercase] = useState(true);
  const [randomExcludeSimilarChars, setRandomExcludeSimilarChars] =
    useState(false);
  const [randomStrict, setRandomStrict] = useState(true);
  const [memorableLength, setMemorableLength] = useState(4);
  const [memorableUseFullWords, setMemorableUseFullWords] = useState(true);
  const [memorableCapitalize, setMemorableCapitalize] = useState(false);
  const [memorableUppercase, setMemorableUppercase] = useState(false);
  const [memorableSeparator, setMemorableSeparator] = useState("-");
  const [pinLength, setPinLength] = useState(6);
  const [strength, setStrength] = useState("");
  const [strengthColor, setStrengthColor] =
    useState<BadgeProps["color"]>(undefined);
  const [crackTime, setCrackTime] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [password, setPassword] = useState("");
  const [hashPassword, setHashPassword] = useState("");
  const [md5String, setMd5String] = useState("");
  const [md5Uppercase, setMd5Uppercase] = useState(false);
  const [bcryptString, setBcryptString] = useState("");
  const [bcryptRounds, setBcryptRounds] = useState(10);
  const [base64String, setBase64String] = useState("");
  const [shaType, setShaType] = useState("256");
  const [sha1String, setSha1String] = useState("");
  const [sha224String, setSha224String] = useState("");
  const [sha256String, setSha256String] = useState("");
  const [sha384String, setSha384String] = useState("");
  const [sha512String, setSha512String] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  const [analysisPassword, setAnalysisPassword] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalyzedResult | null>(
    null
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const randomLengthDebounce = useDebounce(randomLength, 200);
  const memorableLengthDebounce = useDebounce(memorableLength, 200);
  const pinLengthDebounce = useDebounce(pinLength, 200);
  const hashDebounce = useDebounce(hashPassword, 400);
  const analyzeDebounce = useDebounce(analysisPassword, 400);
  const bcryptRoundsDebounce = useDebounce(bcryptRounds, 200);

  const theme = useTheme();
  const { isCopied, copyToClipboard, resetCopyStatus } = useCopy();
  const [storedThemeColorValue, setThemeColorValue] = useLocalStorage(
    ACCENT_COLOR_KEY,
    DEFAULT_ACCENT_COLOR
  );

  async function generateRandomPassword() {
    const pass: string = await natives.generatePassword({
      length: randomLength,
      symbols: randomSymbols,
      numbers: randomNumbers,
      uppercase: randomUppercase,
      lowercase: true,
      spaces: false,
      excludeSimilarCharacters: randomExcludeSimilarChars,
      strict: randomStrict,
    });
    const score: number = await natives.score(pass);
    const time: string = await natives.crackTimes(pass);
    setPassword(pass);
    setStrength(getStrengthString(score));
    setStrengthColor(getStrengthColor(score));
    setCrackTime(time);
    setIsGenerating(false);
    resetCopyStatus();
  }

  async function generateWords() {
    const words: string[] = await natives.generateWords(
      memorableLength,
      memorableUseFullWords
    );
    let pass = words
      .map((w) =>
        memorableUppercase
          ? w.toUpperCase()
          : memorableCapitalize
          ? w.charAt(0).toUpperCase() + w.slice(1)
          : w
      )
      .join(memorableSeparator === "" ? " " : memorableSeparator);
    setPassword(pass);
    setIsGenerating(false);
    resetCopyStatus();
  }

  async function generatePin() {
    setPassword(await natives.generatePin(pinLength));
    setIsGenerating(false);
    resetCopyStatus();
  }

  async function analyzeAsync() {
    setIsAnalyzing(true);
    if (analysisPassword) {
      let obj: AnalyzedResult = await natives.analyze(analysisPassword);
      obj.score = await natives.score(analysisPassword);
      obj.crack_times = await natives.crackTimes(analysisPassword);
      setAnalysisResult(obj);
    } else {
      setAnalysisResult(null);
    }
    setIsAnalyzing(false);
  }

  async function bcryptAsync(password: string, rounds: number) {
    if (password) {
      const value: string = await natives.bcrypt(password, rounds);
      setBcryptString(value);
    }
  }

  async function hashAsync() {
    if (hashPassword) {
      setMd5String(await natives.md5(hashPassword));
      setBase64String(await natives.base64(hashPassword));
      setBcryptString(await natives.bcrypt(hashPassword, bcryptRounds));
      setSha1String(await natives.sha1(hashPassword));
      setSha224String(await natives.sha224(hashPassword));
      setSha256String(await natives.sha256(hashPassword));
      setSha384String(await natives.sha384(hashPassword));
      setSha512String(await natives.sha512(hashPassword));
    } else {
      setMd5String("");
      setBase64String("");
      setBcryptString("");
      setSha1String("");
      setSha224String("");
      setSha256String("");
      setSha384String("");
      setSha512String("");
    }
    setIsCalculating(false);
  }

  useEffect(() => {
    setIsGenerating(true);
    generateRandomPassword();
  }, [
    randomLengthDebounce,
    randomNumbers,
    randomSymbols,
    randomUppercase,
    randomExcludeSimilarChars,
    randomStrict,
  ]);

  useEffect(() => {
    setIsGenerating(true);
    generateWords();
  }, [
    memorableLengthDebounce,
    memorableCapitalize,
    memorableUppercase,
    memorableUseFullWords,
    memorableSeparator,
  ]);

  useEffect(() => {
    setIsGenerating(true);
    generatePin();
  }, [pinLengthDebounce]);

  useEffect(() => {
    setIsCalculating(true);
    hashAsync();
  }, [hashDebounce]);

  useEffect(() => {
    analyzeAsync();
  }, [analyzeDebounce]);

  useEffect(() => {
    bcryptAsync(hashPassword, bcryptRounds);
    setIsCalculating(false);
  }, [bcryptRoundsDebounce]);

  const copy = async () => {
    await copyToClipboard(password);
  };

  useEffect(() => {
    if (passwordType === "random") {
      setIsGenerating(true);
      generateRandomPassword();
    } else if (passwordType === "memorable") {
      setIsGenerating(true);
      generateWords();
    } else if (passwordType === "pin") {
      setIsGenerating(true);
      generatePin();
    }
  }, [passwordType]);

  async function setWindowHeight(height: number) {
    await getCurrentWindow().setSize(new LogicalSize(480, height));
  }

  const { ref } = useResizeObserver<HTMLDivElement>({
    onResize: ({ height }) => {
      if (height) {
        setWindowHeight(height);
      }
    },
  });

  useEffect(() => {
    // disable context menu
    document.addEventListener(
      "contextmenu",
      (e) => {
        e.preventDefault();
        return false;
      },
      { capture: true }
    );
  }, []);

  return (
    <Theme
      appearance={theme}
      hasBackground={true}
      panelBackground="translucent"
      accentColor={storedThemeColorValue as ThemeProps["accentColor"]}
      grayColor="slate"
    >
      <Box ref={ref} data-tauri-drag-region>
        <Box
          height="30px"
          data-tauri-drag-region
          style={{
            backgroundColor:
              theme === "light"
                ? "whitesmoke"
                : theme === "dark"
                ? "black"
                : "",
          }}
        />
        <Tabs.Root value={panelType} onValueChange={setPanelType}>
          <Tabs.List
            justify="center"
            style={{
              backgroundColor:
                theme === "light"
                  ? "whitesmoke"
                  : theme === "dark"
                  ? "black"
                  : "",
            }}
          >
            <Tabs.Trigger value="generator">
              <Flex gap="2" align="center">
                <MagicWandIcon />
                Generator
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value="hasher">
              <Flex gap="2" align="center">
                <CodeIcon />
                Hasher
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value="analyzer">
              <Flex gap="2" align="center">
                <LightningBoltIcon />
                Analyzer
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value="principles">
              <Flex gap="2" align="center">
                <ReaderIcon />
                Principles
              </Flex>
            </Tabs.Trigger>
          </Tabs.List>
          <Box p="3" data-tauri-drag-region>
            <Tabs.Content value="generator">
              <Flex direction="column" gap="2">
                <Text weight="medium" size="2">
                  Choose a password type:
                </Text>
                <RadioCards.Root
                  size="1"
                  columns="3"
                  value={passwordType}
                  onValueChange={setPasswordType}
                  gap="3"
                >
                  <RadioCards.Item value="random">
                    <Flex gap="2" align="center">
                      <ShuffleIcon />
                      Random
                    </Flex>
                  </RadioCards.Item>

                  <RadioCards.Item value="memorable">
                    <Flex gap="2" align="center">
                      <LetterCaseCapitalizeIcon />
                      Memorable
                    </Flex>
                  </RadioCards.Item>
                  <RadioCards.Item value="pin">
                    <Flex gap="2" align="center">
                      <ButtonIcon />
                      PIN
                    </Flex>
                  </RadioCards.Item>
                </RadioCards.Root>
                <Text weight="medium" size="2">
                  Customize your password:
                </Text>
                {passwordType === "random" ? (
                  <Flex
                    direction="column"
                    gap="2"
                    p="2"
                    style={{
                      border: "1px solid var(--gray-6)",
                      borderRadius: "var(--radius-2)",
                      cursor: "default",
                    }}
                  >
                    <Flex gapX="6" gapY="2" align="center" wrap="wrap">
                      <Text as="label" size="2">
                        <Flex gap="2">
                          <Checkbox
                            checked={randomNumbers}
                            onCheckedChange={(checked) =>
                              setRandomNumbers(checked as boolean)
                            }
                          />
                          Numbers
                        </Flex>
                      </Text>
                      <Text as="label" size="2">
                        <Flex gap="2">
                          <Checkbox
                            checked={randomSymbols}
                            onCheckedChange={(checked) =>
                              setRandomSymbols(checked as boolean)
                            }
                          />
                          Symbols
                        </Flex>
                      </Text>
                      <Text as="label" size="2">
                        <Flex gap="2">
                          <Checkbox
                            checked={randomUppercase}
                            onCheckedChange={(checked) =>
                              setRandomUppercase(checked as boolean)
                            }
                          />
                          Uppercase
                        </Flex>
                      </Text>
                      <Text as="label" size="2">
                        <Flex gap="2">
                          <Checkbox
                            checked={randomStrict}
                            onCheckedChange={(checked) =>
                              setRandomStrict(checked as boolean)
                            }
                          />
                          Strict
                        </Flex>
                      </Text>
                      <Text as="label" size="2">
                        <Flex gap="2" align="center">
                          <Checkbox
                            checked={randomExcludeSimilarChars}
                            onCheckedChange={(checked) =>
                              setRandomExcludeSimilarChars(checked as boolean)
                            }
                          />
                          Exclude similar characters
                          <Tooltip content={"iI1loO0\"'`|"}>
                            <QuestionMarkCircledIcon color="gray" />
                          </Tooltip>
                        </Flex>
                      </Text>
                    </Flex>
                    <Flex gap="4" align="center">
                      <Text size="2">Characters</Text>
                      <Slider
                        value={[randomLength]}
                        onValueChange={(values) => setRandomLength(values[0])}
                        min={4}
                        max={128}
                      />
                      <Box width="60px">
                        <TextField.Root
                          type="number"
                          min="4"
                          max="128"
                          value={randomLength}
                          readOnly
                        />
                      </Box>
                    </Flex>
                  </Flex>
                ) : passwordType === "memorable" ? (
                  <Flex
                    direction="column"
                    gap="2"
                    p="2"
                    style={{
                      border: "1px solid var(--gray-6)",
                      borderRadius: "var(--radius-2)",
                      cursor: "default",
                    }}
                  >
                    <Flex gapX="6" gapY="2" align="center" wrap="wrap">
                      <Text as="label" size="2">
                        <Flex gap="2">
                          <Checkbox
                            checked={memorableCapitalize}
                            onCheckedChange={(checked) => {
                              setMemorableCapitalize(checked as boolean);
                              if (checked) {
                                setMemorableUppercase(false);
                              }
                            }}
                          />
                          Capitalize
                        </Flex>
                      </Text>
                      <Text as="label" size="2">
                        <Flex gap="2">
                          <Checkbox
                            checked={memorableUppercase}
                            onCheckedChange={(checked) => {
                              setMemorableUppercase(checked as boolean);
                              if (checked) {
                                setMemorableCapitalize(false);
                              }
                            }}
                          />
                          Uppercase
                        </Flex>
                      </Text>
                      <Text as="label" size="2">
                        <Flex gap="2">
                          <Checkbox
                            checked={memorableUseFullWords}
                            onCheckedChange={(checked) =>
                              setMemorableUseFullWords(checked as boolean)
                            }
                          />
                          Use full words
                        </Flex>
                      </Text>
                    </Flex>
                    <Flex gap="4" align="center">
                      <Text as="label" size="2">
                        Separator
                      </Text>
                      <Box flexGrow="1">
                        <TextField.Root
                          size="2"
                          maxLength={10}
                          value={memorableSeparator}
                          onChange={(e) =>
                            setMemorableSeparator(e.currentTarget.value)
                          }
                        />
                      </Box>
                    </Flex>
                    <Flex gap="4" align="center">
                      <Text as="label" size="2">
                        Characters
                      </Text>
                      <Slider
                        value={[memorableLength]}
                        onValueChange={(values) =>
                          setMemorableLength(values[0])
                        }
                        min={3}
                        max={20}
                      />
                      <Box width="50px">
                        <TextField.Root
                          type="number"
                          min="3"
                          max="20"
                          value={memorableLength}
                          readOnly
                        />
                      </Box>
                    </Flex>
                  </Flex>
                ) : (
                  <Flex
                    direction="column"
                    gap="2"
                    p="2"
                    style={{
                      border: "1px solid var(--gray-6)",
                      borderRadius: "var(--radius-2)",
                      cursor: "default",
                    }}
                  >
                    <Flex gap="4" align="center">
                      <Text size="2">Characters</Text>
                      <Slider
                        value={[pinLength]}
                        onValueChange={(values) => setPinLength(values[0])}
                        min={3}
                        max={12}
                      />
                      <Box width="50px">
                        <TextField.Root
                          type="number"
                          min="3"
                          max="12"
                          value={pinLength}
                          readOnly
                        />
                      </Box>
                    </Flex>
                  </Flex>
                )}
                <Text weight="medium" size="2">
                  Generated password:
                </Text>
                <Box
                  p="2"
                  style={{
                    border: "1px solid var(--gray-6)",
                    borderRadius: "var(--radius-2)",
                    backgroundColor: "var(--color-surface)",
                    cursor: "default",
                  }}
                  onDoubleClick={async () => {
                    await copy();
                  }}
                >
                  <Flex minHeight="90px" align="center" justify="center">
                    <Flex
                      wrap="wrap"
                      align="center"
                      justify="center"
                      gap={passwordType === "pin" ? "2" : "0"}
                    >
                      {[...password].map((char, i) =>
                        char === " " ? (
                          <span key={i}>&nbsp;</span>
                        ) : (
                          <Text
                            key={i}
                            size={passwordType === "pin" ? "8" : "3"}
                            color={
                              isDigit(char)
                                ? "blue"
                                : isLetter(char)
                                ? undefined
                                : "orange"
                            }
                            weight="medium"
                          >
                            {char}
                          </Text>
                        )
                      )}
                    </Flex>
                  </Flex>
                  {passwordType === "random" ? (
                    <Flex
                      direction="column"
                      align="center"
                      justify="center"
                      gap="1"
                      mt="2"
                    >
                      <Badge color={strengthColor}>{strength}</Badge>
                      <Text color="gray" size="1">
                        Estimated time to crack: <Strong>{crackTime}</Strong>
                      </Text>
                    </Flex>
                  ) : null}
                </Box>
                <Flex
                  gap="4"
                  my="2"
                  align="center"
                  justify="center"
                  data-tauri-drag-region
                >
                  <Button
                    loading={isGenerating}
                    onClick={async () => {
                      if (passwordType === "random") {
                        setIsGenerating(true);
                        await generateRandomPassword();
                      } else if (passwordType === "memorable") {
                        setIsGenerating(true);
                        await generateWords();
                      } else if (passwordType === "pin") {
                        setIsGenerating(true);
                        await generatePin();
                      }
                    }}
                  >
                    <UpdateIcon />
                    Refresh Password
                  </Button>
                  <Button
                    variant="outline"
                    color={isCopied ? "green" : "gray"}
                    onClick={async () => {
                      copy();
                    }}
                  >
                    <CopyIcon />
                    {isCopied ? "Password Copied!" : "Copy to Clipboard"}
                  </Button>
                </Flex>
              </Flex>
            </Tabs.Content>
            <Tabs.Content value="hasher">
              <Flex direction="column" gap="2">
                <TextArea
                  placeholder="Enter or paste password here..."
                  value={hashPassword}
                  onChange={(e) => setHashPassword(e.currentTarget.value)}
                />
                <Flex align="center" gap="4" justify="end" px="4">
                  <Flex align="center" gap="4">
                    <Button
                      variant="ghost"
                      onClick={async () => {
                        const clipboardText = await readText();
                        if (clipboardText != hashPassword) {
                          setIsCalculating(true);
                          setHashPassword(clipboardText);
                        }
                      }}
                    >
                      <ClipboardIcon /> Paste
                    </Button>
                    <Button variant="ghost" onClick={() => setHashPassword("")}>
                      <EraserIcon /> Clear
                    </Button>
                  </Flex>
                </Flex>
                <TextBox
                  label="MD5:"
                  rows={1}
                  text={md5Uppercase ? md5String.toUpperCase() : md5String}
                  placeholder="MD5 is a hashing function that creates a unique 128-bit hash with 32 characters long for every string."
                  toolbar={
                    <Flex gap="4" align="center">
                      <Text as="label" size="2">
                        <Flex gap="2">
                          <Checkbox
                            checked={md5Uppercase}
                            onCheckedChange={(checked) =>
                              setMd5Uppercase(checked as boolean)
                            }
                          />
                          Uppercase
                        </Flex>
                      </Text>
                    </Flex>
                  }
                />
                <TextBox
                  label="BCrypt:"
                  text={bcryptString}
                  placeholder="BCrypt is a password-hashing function based on the Blowfish cipher."
                  toolbar={
                    <Flex align="center" gap="2" width="250px">
                      <Text size="2" color="gray">
                        Rounds
                      </Text>
                      <Slider
                        value={[bcryptRounds]}
                        min={4}
                        max={12}
                        size="1"
                        onValueChange={(value) => {
                          setIsCalculating(true);
                          setBcryptRounds(value[0]);
                        }}
                      />
                      <Box width="50px">
                        <TextField.Root
                          value={bcryptRounds}
                          size="1"
                          readOnly
                        />
                      </Box>
                    </Flex>
                  }
                />
                <TextBox
                  label="SHA:"
                  text={
                    shaType === "1"
                      ? sha1String
                      : shaType === "224"
                      ? sha224String
                      : shaType === "256"
                      ? sha256String
                      : shaType === "384"
                      ? sha384String
                      : shaType === "512"
                      ? sha512String
                      : ""
                  }
                  rows={3}
                  placeholder={
                    shaType === "1"
                      ? "SHA1 has a 160-bit hash output which corresponds to a 40 character string."
                      : shaType === "224"
                      ? "SHA224 is a hashing function that creates a unique 224-bit hash with 56 characters long for every string."
                      : shaType === "256"
                      ? "SHA256 is a hashing function that creates a unique 256-bit hash with 64 characters long for every string."
                      : shaType === "384"
                      ? "SHA384 is a hashing function that creates a unique 384-bit hash with 96 characters long for every string."
                      : shaType === "512"
                      ? "SHA512 is a hashing function that creates a unique 512-bit hash with 128 characters long for every string."
                      : ""
                  }
                  toolbar={
                    <RadioGroup.Root value={shaType} onValueChange={setShaType}>
                      <Flex align="center" gap="4" pr="2">
                        <RadioGroup.Item value="1">1</RadioGroup.Item>
                        <RadioGroup.Item value="224">224</RadioGroup.Item>
                        <RadioGroup.Item value="256">256</RadioGroup.Item>
                        <RadioGroup.Item value="384">384</RadioGroup.Item>
                        <RadioGroup.Item value="512">512</RadioGroup.Item>
                      </Flex>
                    </RadioGroup.Root>
                  }
                />
                <TextBox
                  label="Base64:"
                  text={base64String}
                  rows={4}
                  placeholder="Base64 is a binary-to-text encoding scheme."
                />
                <Flex
                  align="center"
                  gap="2"
                  justify="center"
                  height="1px"
                  mt="1"
                >
                  {isCalculating ? (
                    <>
                      <Spinner size="1" />
                      <Text color="gray" size="1">
                        calculating...
                      </Text>
                    </>
                  ) : null}
                </Flex>
              </Flex>
            </Tabs.Content>
            <Tabs.Content value="analyzer">
              <Flex direction="column" mb="3">
                <TextArea
                  placeholder="Enter or paste password here..."
                  value={analysisPassword}
                  rows={2}
                  onChange={(e) => setAnalysisPassword(e.currentTarget.value)}
                />
              </Flex>
              <Flex align="center" gap="4" justify="end" pr="2" mb="3">
                <Button
                  variant="ghost"
                  onClick={async () => {
                    const clipboardText = await readText();
                    if (clipboardText !== analysisPassword) {
                      setIsAnalyzing(true);
                      setAnalysisPassword(clipboardText);
                    }
                  }}
                >
                  <ClipboardIcon /> Paste
                </Button>
                <Button variant="ghost" onClick={() => setAnalysisPassword("")}>
                  <EraserIcon /> Clear
                </Button>
              </Flex>
              <Flex direction="column" gap="4">
                <Table.Root variant="surface" size="1">
                  <Table.Body>
                    <Table.Row>
                      <Table.Cell>
                        <Text color="gray">Number of characters</Text>
                      </Table.Cell>
                      <Table.Cell align="right">
                        {analysisResult?.length}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>
                        <Text color="gray">Lowercase letters</Text>
                      </Table.Cell>
                      <Table.Cell align="right">
                        {analysisResult?.lowercase_letters_count}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>
                        <Text color="gray">Uppercase letters</Text>
                      </Table.Cell>
                      <Table.Cell align="right">
                        {analysisResult?.uppercase_letters_count}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>
                        <Text color="gray">Numbers</Text>
                      </Table.Cell>
                      <Table.Cell align="right">
                        {analysisResult?.numbers_count}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>
                        <Text color="gray">Spaces</Text>
                      </Table.Cell>
                      <Table.Cell align="right">
                        {analysisResult?.spaces_count}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>
                        <Text color="gray">Symbols</Text>
                      </Table.Cell>
                      <Table.Cell align="right">
                        {analysisResult?.symbols_count}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>
                        <Text color="gray">Other characters</Text>
                      </Table.Cell>
                      <Table.Cell align="right">
                        {analysisResult?.other_characters_count}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>
                        <Text color="gray">
                          Consecutive repeated characters
                        </Text>
                      </Table.Cell>
                      <Table.Cell align="right">
                        {analysisResult?.consecutive_count}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>
                        <Text color="gray">
                          Non consecutive repeated characters
                        </Text>
                      </Table.Cell>
                      <Table.Cell align="right">
                        {analysisResult?.non_consecutive_count}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>
                        <Text color="gray">Progressive characters</Text>
                      </Table.Cell>
                      <Table.Cell align="right">
                        {analysisResult?.progressive_count}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>
                        <Text color="gray">Strength</Text>
                      </Table.Cell>
                      <Table.Cell align="right">
                        {analysisResult ? (
                          <Badge color={getStrengthColor(analysisResult.score)}>
                            {getStrengthString(analysisResult.score)}
                          </Badge>
                        ) : (
                          ""
                        )}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>
                        <Text color="gray">Common password</Text>
                      </Table.Cell>
                      <Table.Cell align="right">
                        {analysisResult ? (
                          analysisResult.is_common ? (
                            <Badge color="red">YES</Badge>
                          ) : (
                            <Badge color="green">NO</Badge>
                          )
                        ) : (
                          ""
                        )}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>
                        <Text color="gray">Estimated time to crack</Text>
                      </Table.Cell>
                      <Table.Cell align="right">
                        {analysisResult?.crack_times}
                      </Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table.Root>
              </Flex>
              <Flex align="center" gap="2" justify="center" height="1px" mt="3">
                {isAnalyzing ? (
                  <>
                    <Spinner size="1" />
                    <Text color="gray" size="1">
                      analyzing...
                    </Text>
                  </>
                ) : null}
              </Flex>
            </Tabs.Content>
            <Tabs.Content value="principles">
              <Text size="4" weight="medium" align="center">
                The principles of generating a strong password
              </Text>
              <Flex direction="column" gap="2" mt="4" px="4">
                <Text size="3" weight="medium">
                  Make it unique
                </Text>
                <Text size="2" color="gray" mb="2">
                  Passwords should be unique to different accounts. This reduces
                  the likelihood that multiple accounts of yours could be hacked
                  if one of your passwords is exposed in a data breach.
                </Text>
                <Text size="3" weight="medium">
                  Make it random
                </Text>
                <Text size="2" color="gray" mb="2">
                  The password has a combination of uppercase and lowercase
                  letters, numbers, special characters, and words with no
                  discernable pattern, unrelated to your personal information.
                </Text>
                <Text size="3" weight="medium">
                  Make it long
                </Text>
                <Text size="2" color="gray" mb="2">
                  The password consists of 14 characters or longer. An
                  8-character password will take a hacker 39 minutes to crack
                  while a 16-character password will take a hacker a billion
                  years to crack.
                </Text>
              </Flex>
              <Flex gap="2" wrap="wrap" justify="center" p="3">
                {COLORS.map((color) => (
                  <IconButton
                    color={color}
                    size="1"
                    value={color}
                    key={color}
                    onClick={(e) => {
                      setThemeColorValue(e.currentTarget.value);
                    }}
                  ></IconButton>
                ))}
              </Flex>
            </Tabs.Content>
          </Box>
        </Tabs.Root>
      </Box>
    </Theme>
  );
}

function TextBox({
  label,
  text,
  placeholder,
  rows,
  toolbar,
}: {
  label: string;
  text: string;
  placeholder?: string;
  rows?: number;
  toolbar?: ReactNode;
}) {
  const { isCopied, copyToClipboard } = useCopy();
  const { hovered, ref } = useHover();

  return (
    <Flex direction="column" gap="2">
      <Flex justify="between">
        <Text weight="medium">{label}</Text>
        {toolbar}
      </Flex>
      <Box position="relative" ref={ref}>
        <TextArea
          readOnly
          rows={rows || undefined}
          value={text}
          placeholder={placeholder}
        />
        <Box position="absolute" top="2" right="2">
          {(hovered || isCopied) && text ? (
            <IconButton
              size="1"
              radius="large"
              color={isCopied ? "green" : undefined}
              onClick={() => copyToClipboard(text)}
              variant="solid"
            >
              {isCopied ? <CheckIcon /> : <CopyIcon />}
            </IconButton>
          ) : null}
        </Box>
      </Box>
    </Flex>
  );
}

export default App;
