const fs = require('fs')
const path = require('path')

// Get the GeoJSON file name from command-line arguments
const args = process.argv.slice(2)
if (args.length === 0) {
  console.error(
    'Please provide the GeoJSON file name as a command-line argument.'
  )
  process.exit(1)
}

const geojsonFile = args[0]

let jsonData
try {
  const data = fs.readFileSync(geojsonFile, 'utf8')
  jsonData = JSON.parse(data)
} catch (err) {
  console.error('Error reading or parsing GeoJSON file:', err)
  process.exit(1)
}

// Function to extract coordinates from features
function extractCoordinates(features) {
  const coordinatesArray = []
  features.forEach((feature) => {
    const geometry = feature.geometry
    if (geometry.type === 'Point') {
      coordinatesArray.push(geometry.coordinates)
    } else if (
      geometry.type === 'LineString' ||
      geometry.type === 'MultiPoint'
    ) {
      geometry.coordinates.forEach((coord) => coordinatesArray.push(coord))
    } else if (
      geometry.type === 'Polygon' ||
      geometry.type === 'MultiLineString'
    ) {
      geometry.coordinates.forEach((ringOrLine) => {
        ringOrLine.forEach((coord) => coordinatesArray.push(coord))
      })
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach((polygon) => {
        polygon.forEach((ring) => {
          ring.forEach((coord) => coordinatesArray.push(coord))
        })
      })
    }
  })
  return coordinatesArray
}

// Function to convert coordinates to CSV format with longitudes in one row and latitudes in another
function convertToCSV(coordinates) {
  let csvContent = 'Longitude;Latitude\n'
  coordinates.forEach((coords) => {
    csvContent += `${coords[0]};${coords[1]}\n`
  })
  return csvContent
}

// Extract coordinates from JSON data
const coordinates = extractCoordinates(jsonData.features)

// Convert coordinates to CSV
const csvData = convertToCSV(coordinates)

// Generate the CSV file name
const baseName = path.basename(geojsonFile, path.extname(geojsonFile))
const csvFile = `${baseName}.csv`

// Write CSV data to a file synchronously
try {
  fs.writeFileSync(csvFile, csvData, 'utf8')
  console.log(`CSV file saved successfully as ${csvFile}!`)
} catch (err) {
  console.error('Error writing CSV file:', err)
}

console.log('Script execution completed.')
