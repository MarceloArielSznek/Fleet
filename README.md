# Fleet Management System

A comprehensive web application for managing a vehicle fleet, including tracking vehicle details, maintenance status, and driver assignments.

## Features

- **Vehicle Management**: Add, edit, view, and delete vehicles in your fleet
- **Image Upload**: Upload and manage vehicle images
- **Responsive Design**: Works on desktop and mobile devices
- **Status Tracking**: Monitor vehicle status (active, maintenance, retired)
- **Dashboard**: View fleet overview and recent activities
- **Vehicle Details**: Comprehensive vehicle information display
- **Image Gallery**: Carousel display of featured vehicles

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript, EJS templates
- **Backend**: Node.js, Express.js
- **Data Storage**: JSON file storage
- **Image Processing**: Multer for file uploads

## Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/fleet-management.git
cd fleet-management
```

2. Install dependencies:
```
npm install
```

3. Create required directories:
```
mkdir -p data
mkdir -p public/images/vehicles
```

4. Start the application:
```
npm start
```

5. Access the application at `http://localhost:3000`

## Usage Guide

### Dashboard

The dashboard provides a quick overview of:
- Total vehicles in the fleet
- Vehicles in maintenance
- Assigned drivers
- A carousel of featured vehicles
- Recent activity log

### Vehicle Management

- **View Vehicles**: Navigate to the Vehicles page to see all fleet vehicles
- **Add Vehicle**: Click "Add Vehicle" to register a new vehicle with details like:
  - Brand, model, and year
  - License plate number
  - Vehicle type and status
  - Fuel type and mileage
  - Optional driver assignment
  - Vehicle image

- **Vehicle Details**: Click on any vehicle to view its complete information
- **Edit Vehicle**: Update vehicle information including status and maintenance dates
- **Delete Vehicle**: Remove vehicles from the system

### Image Management

- Upload images during vehicle creation or editing
- Preview images before upload
- Automatically resize and optimize images
- Default image for vehicles without custom images

## Configuration

The application stores data in the following locations:
- Vehicle data: `data/vehicles.json`
- Vehicle images: `public/images/vehicles/`

## Development

### Project Structure

- `models/` - Data models and business logic
- `controllers/` - Route handlers and business logic
- `routes/` - API and web route definitions
- `views/` - EJS templates for rendering HTML
- `public/` - Static assets (CSS, JavaScript, images)
- `data/` - JSON data storage

### Customization

- Modify CSS in `public/css/style.css` to change appearance
- Edit EJS templates in `views/` to change page structure
- Update vehicle model in `models/vehicle.js` to add new fields

## License

[MIT License](LICENSE)

## Contributors

- Your Name - Initial development 