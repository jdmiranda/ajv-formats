const Ajv = require("ajv")
const addFormats = require("./dist/index")

// Test data for each format
const testData = {
  date: ["2023-01-15", "2024-12-31", "2025-06-01"],
  time: ["12:30:45Z", "23:59:60+00:00", "00:00:00-05:00"],
  "date-time": ["2023-01-15T12:30:45Z", "2024-12-31T23:59:59+00:00"],
  "iso-time": ["12:30:45.123Z", "23:59:60"],
  "iso-date-time": ["2023-01-15T12:30:45.123Z", "2024-12-31 23:59:59Z"],
  duration: ["P1Y2M3DT4H5M6S", "P3W", "PT1H30M"],
  uri: ["https://example.com/path", "ftp://files.example.com/file.txt"],
  "uri-reference": ["/path/to/resource", "https://example.com"],
  "uri-template": ["https://example.com/{id}", "http://api.example.com/users{?page,size}"],
  url: ["https://www.example.com", "http://test.org:8080/path?query=value"],
  email: ["user@example.com", "test.user+tag@example.co.uk"],
  hostname: ["example.com", "subdomain.example.com"],
  ipv4: ["192.168.1.1", "10.0.0.1", "255.255.255.255"],
  ipv6: ["2001:0db8:85a3:0000:0000:8a2e:0370:7334", "::1", "fe80::1"],
  regex: ["^[a-z]+$", "\\d{3}-\\d{4}", "[A-Z][a-z]*"],
  uuid: ["550e8400-e29b-41d4-a716-446655440000", "urn:uuid:f47ac10b-58cc-4372-a567-0e02b2c3d479"],
  "json-pointer": ["/foo/bar", "/items/0", "/"],
  "json-pointer-uri-fragment": ["#/definitions/User", "#/properties/name"],
  "relative-json-pointer": ["0", "1/items", "2#"],
  byte: ["SGVsbG8gV29ybGQ=", "VGVzdA=="],
  int32: [0, 2147483647, -2147483648],
  int64: [0, 9007199254740991, -9007199254740991],
  float: [3.14, -273.15, 0.0],
  double: [3.141592653589793, -273.15, 1.7976931348623157e308],
}

function benchmark(formatName, values, iterations = 100000) {
  const ajv = new Ajv()
  addFormats(ajv)

  const schema = {type: typeof values[0], format: formatName}
  const validate = ajv.compile(schema)

  // Warm-up
  for (let i = 0; i < 1000; i++) {
    for (const value of values) {
      validate(value)
    }
  }

  // Benchmark
  const start = process.hrtime.bigint()
  for (let i = 0; i < iterations; i++) {
    for (const value of values) {
      validate(value)
    }
  }
  const end = process.hrtime.bigint()

  const totalTime = Number(end - start) / 1e6 // Convert to milliseconds
  const totalValidations = iterations * values.length
  const validationsPerSecond = (totalValidations / totalTime) * 1000

  return {
    format: formatName,
    totalValidations,
    timeMs: totalTime.toFixed(2),
    validationsPerSec: Math.round(validationsPerSecond).toLocaleString(),
  }
}

console.log("AJV Formats Performance Benchmark")
console.log("=" + "=".repeat(70))
console.log("")

const results = []

for (const [formatName, values] of Object.entries(testData)) {
  const result = benchmark(formatName, values)
  results.push(result)
  console.log(
    `${result.format.padEnd(25)} | ${result.validationsPerSec.padStart(
      15
    )} validations/sec | ${result.timeMs.padStart(10)} ms`
  )
}

console.log("")
console.log("=" + "=".repeat(70))
console.log("Benchmark completed successfully")
console.log("")

// Summary statistics
const totalValidations = results.reduce((sum, r) => sum + r.totalValidations, 0)
const totalTime = results.reduce((sum, r) => sum + parseFloat(r.timeMs), 0)
const avgValidationsPerSec = (totalValidations / totalTime) * 1000

console.log(`Total validations: ${totalValidations.toLocaleString()}`)
console.log(`Total time: ${totalTime.toFixed(2)} ms`)
console.log(`Average: ${Math.round(avgValidationsPerSec).toLocaleString()} validations/sec`)
