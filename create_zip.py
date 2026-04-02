import os
import zipfile

def create_zip(source_dir, output_filename):
    # Exclude these directories to keep the zip file size small
    exclude_dirs = {'node_modules', '.venv', 'venv', 'env', '__pycache__', '.git', 'dist', 'build'}
    exclude_files = {'.env', output_filename}

    print(f"Creating {output_filename}...")
    
    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            # Modify dirs in-place to skip excluded directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file in files:
                if file in exclude_files:
                    continue
                
                # Get the full path of the file
                file_path = os.path.join(root, file)
                
                # Calculate the relative path for the zip file to maintain structure
                arcname = os.path.relpath(file_path, source_dir)
                zipf.write(file_path, arcname)
                
    print(f"Successfully created: {output_filename}")
    print("You can now upload this file to GitHub using the 'Upload files' option.")

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    output_file = "smart-attendance.zip"
    create_zip(current_dir, output_file)
