# Use a lightweight Python base image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container
# Because you set "Root Directory" to "backend" on Render, 
# this looks for requirements.txt in the backend folder.
COPY requirements.txt .

# Install dependencies - this is the step that installs SQLAlchemy
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose the port and start the app
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
