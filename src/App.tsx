import { ReactNode, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { readText } from "@tauri-apps/plugin-clipboard-manager";
import useResizeObserver from "use-resize-observer";
import {
  Flex,
  Theme,
  Text,
  Button,
  Grid,
  Card,
  Slider,
  TextField,
  Box,
  Switch,
  Badge,
  DataList,
  BadgeProps,
  Tabs,
  RadioCards,
  Heading,
  Separator,
  TextArea,
  IconButton,
  Checkbox,
  RadioGroup,
  Spinner,
  Table,
  ButtonProps,
  ThemeProps,
} from "@radix-ui/themes";
import {
  BookOpenIcon,
  CheckIcon,
  ClipboardPasteIcon,
  CopyIcon,
  DraftingCompassIcon,
  FlaskConicalIcon,
  HashIcon,
  LightbulbIcon,
  PaintbrushIcon,
  ShieldCheckIcon,
  ShuffleIcon,
  SignatureIcon,
  SquareAsteriskIcon,
  WandIcon,
} from "lucide-react";
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

interface AnalyzedResult {
  password: string;
  length: number;
  spaces_count: number;
  numbers_count: number;
  lowercase_letters_count: number;
  uppercase_letters_count: number;
  symbols_count: number;
  other_characters_count: number;
  consecutive_count: number;
  non_consecutive_count: number;
  progressive_count: number;
  is_common: boolean;
  crack_times?: string;
  score: number;
}

function App() {
  const [panelType, setPanelType] = useState("generator");
  const [passwordType, setPasswordType] = useState("random");
  const [randomLength, setRandomLength] = useState(20);
  const [randomSymbols, setRandomSymbols] = useState(false);
  const [randomNumbers, setRandomNumbers] = useState(true);
  const [randomUppercase, setRandomUppercase] = useState(true);
  const [randomExcludeSimilarChars, setRandomExcludeSimilarChars] =
    useState(false);
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
  const [password, setPassword] = useState("");
  const [hashPassword, setHashPassword] = useState("");
  const [md5String, setMd5String] = useState("");
  const [md5Uppercase, setMd5Uppercase] = useState(false);
  const [bcryptString, setBcryptString] = useState("");
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

  const theme = useTheme();
  const { isCopied, copyToClipboard, resetCopyStatus } = useCopy();
  const [storedValue, setValue] = useLocalStorage(
    ACCENT_COLOR_KEY,
    DEFAULT_ACCENT_COLOR
  );

  async function gen_random_password() {
    const pass: string = await invoke("gen_password", {
      length: randomLength,
      symbols: randomSymbols,
      numbers: randomNumbers,
      uppercase: randomUppercase,
      excludeSimilarCharacters: randomExcludeSimilarChars,
    });
    const score: number = await invoke("score", { password: pass });
    const time: string = await invoke("crack_times", {
      password: pass,
    });
    setPassword(pass);
    setStrength(getStrengthString(score));
    setStrengthColor(getStrengthColor(score));
    setCrackTime(time);
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
          : memorableCapitalize
          ? w.charAt(0).toUpperCase() + w.slice(1)
          : w
      )
      .join(memorableSeparator === "" ? " " : memorableSeparator);
    setPassword(pass);
    resetCopyStatus();
  }

  async function gen_pin() {
    setPassword(
      await invoke("gen_pin", {
        length: pinLength,
      })
    );
    resetCopyStatus();
  }

  async function analyzeAsync() {
    setIsAnalyzing(true);
    if (analysisPassword) {
      let obj: AnalyzedResult = await invoke("analyze", {
        password: analysisPassword,
      });
      obj.score = await invoke("score", {
        password: analysisPassword,
      });
      obj.crack_times = await invoke("crack_times", {
        password: analysisPassword,
      });
      setAnalysisResult(obj);
    } else {
      setAnalysisResult(null);
    }
    setIsAnalyzing(false);
  }

  async function hashAsync() {
    setIsCalculating(true);
    if (hashPassword) {
      setMd5String(
        await invoke("md5", {
          password: hashPassword,
        })
      );
      setBase64String(
        await invoke("base64", {
          password: hashPassword,
        })
      );
      setBcryptString(
        await invoke("bcrypt", {
          password: hashPassword,
        })
      );
      setSha1String(
        await invoke("sha1", {
          password: hashPassword,
        })
      );
      setSha224String(
        await invoke("sha224", {
          password: hashPassword,
        })
      );
      setSha256String(
        await invoke("sha256", {
          password: hashPassword,
        })
      );
      setSha384String(
        await invoke("sha384", {
          password: hashPassword,
        })
      );
      setSha512String(
        await invoke("sha512", {
          password: hashPassword,
        })
      );
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

  const hash = useDebounce(hashPassword, 400);
  const analyze = useDebounce(analysisPassword, 400);

  useEffect(() => {
    gen_random_password();
  }, [
    randomLength,
    randomNumbers,
    randomSymbols,
    randomUppercase,
    randomExcludeSimilarChars,
  ]);

  useEffect(() => {
    gen_words();
  }, [
    memorableLength,
    memorableCapitalize,
    memorableUppercase,
    memorableUseFullWords,
    memorableSeparator,
  ]);

  useEffect(() => {
    gen_pin();
  }, [pinLength]);

  useEffect(() => {
    hashAsync();
  }, [hash]);

  useEffect(() => {
    analyzeAsync();
  }, [analyze]);

  const copy = async () => {
    await copyToClipboard(password);
  };

  useEffect(() => {
    if (passwordType === "random") {
      gen_random_password();
    } else if (passwordType === "memorable") {
      gen_words();
    } else if (passwordType === "pin") {
      gen_pin();
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

  return (
    <Theme
      appearance={theme}
      hasBackground={true}
      panelBackground="translucent"
      accentColor={storedValue as ThemeProps["accentColor"]}
      grayColor="slate"
    >
      <Box ref={ref}>
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
        ></Box>
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
                <WandIcon size={16} />
                Generator
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value="hasher">
              <Flex gap="2" align="center">
                <HashIcon size={16} />
                Hasher
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value="analyzer">
              <Flex gap="2" align="center">
                <FlaskConicalIcon size={16} />
                Analyzer
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value="principles">
              <Flex gap="2" align="center">
                <BookOpenIcon size={16} />
                Principles
              </Flex>
            </Tabs.Trigger>
          </Tabs.List>
          <Box px="5" py="4">
            <Tabs.Content value="generator">
              <Flex direction="column" gap="2">
                <Text weight="medium">Choose a password type</Text>
                <RadioCards.Root
                  size="1"
                  columns="3"
                  value={passwordType}
                  onValueChange={setPasswordType}
                  my="2"
                  gap="3"
                >
                  <RadioCards.Item value="random">
                    <Flex gap="2" align="center">
                      <ShuffleIcon size={16} strokeWidth={1} />
                      Random
                    </Flex>
                  </RadioCards.Item>

                  <RadioCards.Item value="memorable">
                    <Flex gap="2" align="center">
                      <LightbulbIcon size={16} strokeWidth={1} />
                      Memorable
                    </Flex>
                  </RadioCards.Item>
                  <RadioCards.Item value="pin">
                    <Flex gap="2" align="center">
                      <SquareAsteriskIcon size={16} strokeWidth={1} />
                      PIN
                    </Flex>
                  </RadioCards.Item>
                </RadioCards.Root>
                <Text weight="medium">Customize your password</Text>
                {passwordType === "random" ? (
                  <Flex direction="column" gap="4" my="2">
                    <Flex gap="4" align="center">
                      <Text color="gray">Characters</Text>
                      <Slider
                        value={[randomLength]}
                        onValueChange={(values) => setRandomLength(values[0])}
                        min={4}
                        max={100}
                      />
                      <Box width="50px">
                        <TextField.Root
                          size="1"
                          type="number"
                          min="4"
                          max="100"
                          value={randomLength}
                          readOnly
                        />
                      </Box>
                    </Flex>
                    <Separator size="4" />
                    <Flex gap="4" align="center" wrap="wrap">
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
                    <Flex gap="4" align="center" wrap="wrap">
                      <Text color="gray">
                        Exclude similar characters(iI1loO0"'`|)
                      </Text>
                      <Switch
                        checked={randomExcludeSimilarChars}
                        onCheckedChange={setRandomExcludeSimilarChars}
                      />
                    </Flex>
                  </Flex>
                ) : passwordType === "memorable" ? (
                  <Flex my="2" direction="column" gap="4">
                    <Flex gap="4" align="center">
                      <Text color="gray">Characters</Text>
                      <Slider
                        value={[memorableLength]}
                        onValueChange={(values) =>
                          setMemorableLength(values[0])
                        }
                        min={3}
                        max={15}
                      />
                      <Box width="50px">
                        <TextField.Root
                          size="1"
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
                      <Text color="gray">Capitalize</Text>
                      <Switch
                        checked={memorableCapitalize}
                        onCheckedChange={(checked) => {
                          setMemorableCapitalize(checked);
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
                            setMemorableCapitalize(false);
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
                      <Box width="100px">
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
                  </Flex>
                ) : (
                  <Flex my="2" direction="column" gap="4">
                    <Flex gap="4" align="center">
                      <Text color="gray">Characters</Text>
                      <Slider
                        value={[pinLength]}
                        onValueChange={(values) => setPinLength(values[0])}
                        min={3}
                        max={12}
                      />
                      <Box width="50px">
                        <TextField.Root
                          size="1"
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
                <Text weight="medium" my="2">
                  Generated Password
                </Text>
                <Card>
                  <Flex minHeight="80px" align="center" justify="center" p="2">
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
                            size={passwordType === "pin" ? "8" : "4"}
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
                </Card>
                {passwordType === "random" ? (
                  <Box my="2">
                    <DataList.Root>
                      <DataList.Item align="center">
                        <DataList.Label>Your password strength:</DataList.Label>
                        <DataList.Value>
                          <Badge color={strengthColor}>{strength}</Badge>
                        </DataList.Value>
                      </DataList.Item>
                      <DataList.Item align="center">
                        <DataList.Label>
                          Estimated time to crack:
                        </DataList.Label>
                        <DataList.Value>{crackTime}</DataList.Value>
                      </DataList.Item>
                    </DataList.Root>
                  </Box>
                ) : null}
                <Grid columns="2" gap="4" width="auto" my="2">
                  <Button
                    size="3"
                    variant="solid"
                    color={isCopied ? "green" : undefined}
                    onClick={async () => {
                      setHashPassword(password);
                      setAnalysisPassword(password);
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
                        ? gen_random_password()
                        : passwordType === "memorable"
                        ? gen_words()
                        : passwordType === "pin"
                        ? gen_pin()
                        : null;
                    }}
                  >
                    Refresh Password
                  </Button>
                </Grid>
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
              <Flex align="center" gap="4" justify="between" pr="2" mb="5">
                <Text color="gray" size="2">
                  {analysisResult ? `${analysisResult?.length} Characters` : ""}
                </Text>
                <Flex align="center" gap="4">
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      const clipboardText = await readText();
                      setAnalysisPassword(clipboardText);
                    }}
                  >
                    <ClipboardPasteIcon size={16} strokeWidth={1} /> Paste
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setAnalysisPassword("")}
                  >
                    <PaintbrushIcon size={16} strokeWidth={1} /> Clear
                  </Button>
                </Flex>
              </Flex>

              <Flex direction="column" gap="2">
                <Table.Root variant="surface">
                  <Table.Body>
                    <Table.Row>
                      <Table.Cell>Lowercase letters</Table.Cell>
                      <Table.Cell>
                        {analysisResult?.lowercase_letters_count}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>Uppercase letters</Table.Cell>
                      <Table.Cell>
                        {analysisResult?.uppercase_letters_count}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>Numbers</Table.Cell>
                      <Table.Cell>{analysisResult?.numbers_count}</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>Spaces</Table.Cell>
                      <Table.Cell>{analysisResult?.spaces_count}</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>Symbols</Table.Cell>
                      <Table.Cell>{analysisResult?.symbols_count}</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>Other characters</Table.Cell>
                      <Table.Cell>
                        {analysisResult?.other_characters_count}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>Consecutive repeated characters</Table.Cell>
                      <Table.Cell>
                        {analysisResult?.consecutive_count}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>
                        Non consecutive repeated characters
                      </Table.Cell>
                      <Table.Cell>
                        {analysisResult?.non_consecutive_count}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>Progressive characters</Table.Cell>
                      <Table.Cell>
                        {analysisResult?.progressive_count}
                      </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                      <Table.Cell>Strength</Table.Cell>
                      <Table.Cell>
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
                      <Table.Cell>Common password</Table.Cell>
                      <Table.Cell>
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
                      <Table.Cell>Estimated time to crack</Table.Cell>
                      <Table.Cell>{analysisResult?.crack_times}</Table.Cell>
                    </Table.Row>
                  </Table.Body>
                </Table.Root>
                <Flex align="center" gap="4" justify="center" height="12px">
                  {isAnalyzing ? (
                    <>
                      <Spinner />
                      <Text color="gray">analyzing...</Text>
                    </>
                  ) : null}
                </Flex>
              </Flex>
            </Tabs.Content>
            <Tabs.Content value="hasher">
              <Flex direction="column" gap="3">
                <TextArea
                  placeholder="Enter or paste password here..."
                  value={hashPassword}
                  rows={2}
                  onChange={(e) => setHashPassword(e.currentTarget.value)}
                />
                <Flex align="center" gap="4" justify="end" pr="2" mb="4">
                  <Flex align="center" gap="4">
                    <Button
                      variant="ghost"
                      onClick={async () => {
                        const clipboardText = await readText();
                        setHashPassword(clipboardText);
                      }}
                    >
                      <ClipboardPasteIcon size={16} strokeWidth={1} /> Paste
                    </Button>
                    <Button variant="ghost" onClick={() => setHashPassword("")}>
                      <PaintbrushIcon size={16} strokeWidth={1} /> Clear
                    </Button>
                  </Flex>
                </Flex>
                <TextBox
                  label="MD5"
                  text={md5Uppercase ? md5String.toUpperCase() : md5String}
                  placeholder="MD5 is a hashing function that creates a unique 128-bit hash with 32 characters long for every string."
                  toolbar={
                    <Flex gap="4" align="center" p="1">
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
                  label="BCrypt"
                  text={bcryptString}
                  placeholder="BCrypt is a password-hashing function based on the Blowfish cipher."
                />
                <TextBox
                  label="SHA"
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
                  label="Base64"
                  text={base64String}
                  rows={5}
                  placeholder="Base64 is a binary-to-text encoding scheme."
                />
                <Flex align="center" gap="4" justify="center" height="12px">
                  {isCalculating ? (
                    <>
                      <Spinner />
                      <Text color="gray">calculating...</Text>
                    </>
                  ) : null}
                </Flex>
              </Flex>
            </Tabs.Content>
            <Tabs.Content value="principles">
              <Flex direction="column" gap="2" p="2">
                <Heading size="6" mb="2">
                  The principles of generating a strong password
                </Heading>
                <Flex gap="4" align="center">
                  <SignatureIcon strokeWidth={1} />
                  <Heading size="5" align="center">
                    Make it unique
                  </Heading>
                </Flex>
                <Text size="3" color="gray" mb="2">
                  Passwords should be unique to different accounts. This reduces
                  the likelihood that multiple accounts of yours could be hacked
                  if one of your passwords is exposed in a data breach.
                </Text>
                <Flex gap="4" align="center">
                  <ShuffleIcon strokeWidth={1} />
                  <Heading size="5" align="center">
                    Make it random
                  </Heading>
                </Flex>
                <Text size="3" color="gray" mb="2">
                  The password has a combination of uppercase and lowercase
                  letters, numbers, special characters, and words with no
                  discernable pattern, unrelated to your personal information.
                </Text>
                <Flex gap="4" align="center">
                  <DraftingCompassIcon strokeWidth={1} />
                  <Heading size="5" align="center">
                    Make it long
                  </Heading>
                </Flex>
                <Text size="3" color="gray" mb="2">
                  The password consists of 14 characters or longer. An
                  8-character password will take a hacker 39 minutes to crack
                  while a 16-character password will take a hacker a billion
                  years to crack.
                </Text>
              </Flex>
              <Flex gap="2" wrap="wrap" align="center" justify="center" my="4">
                {COLORS.map((color) => (
                  <IconButton
                    color={color}
                    size="1"
                    value={color}
                    key={color}
                    onClick={(e) => {
                      setValue(e.currentTarget.value);
                    }}
                  ></IconButton>
                ))}
              </Flex>
              <Flex align="center" justify="center" p="2">
                <ShieldCheckIcon size={32} color="gray" strokeWidth={1} />
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
          {hovered && text ? (
            <IconButton
              size="1"
              radius="large"
              color={isCopied ? "green" : undefined}
              onClick={() => copyToClipboard(text)}
              variant="solid"
            >
              {isCopied ? (
                <CheckIcon size={12} strokeWidth={1.5} />
              ) : (
                <CopyIcon size={12} strokeWidth={1.5} />
              )}
            </IconButton>
          ) : null}
        </Box>
      </Box>
    </Flex>
  );
}

export default App;
