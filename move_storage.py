
from replit.object_storage import Client

def move_file(source_path, destination_path):
    # Create client instance
    client = Client()
    
    try:
        # Read the content from source
        content = client.download_from_text(source_path)
        
        # Upload to new destination
        client.upload_from_text(destination_path, content)
        
        # Delete the original file
        client.delete(source_path)
        
        print(f"Successfully moved {source_path} to {destination_path}")
    except Exception as e:
        print(f"Error moving file: {e}")

# Example usage:
# move_file("original_location/file.txt", "new_location/file.txt")
