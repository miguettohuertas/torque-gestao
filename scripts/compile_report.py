import os
import subprocess
import shutil

# Configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ACADEMIC_DIR = os.path.join(BASE_DIR, 'docs', 'academic')
REPORT_NAME = 'report' # report.tex
OUTPUT_NAME = 'Torque_Gestao_Final_Report'

def compile_latex():
    print(f"🚀 Starting LaTeX compilation in {ACADEMIC_DIR}...")
    
    # Check if pdflatex is available
    if not shutil.which('pdflatex'):
        print("❌ Error: 'pdflatex' not found. Please install a LaTeX distribution (like MiKTeX or TeX Live) and add it to your PATH.")
        return False

    try:
        # Step 1: pdflatex (first pass)
        print("📥 Pass 1: Generating auxiliary files...")
        subprocess.run(['pdflatex', '-interaction=nonstopmode', f'{REPORT_NAME}.tex'], cwd=ACADEMIC_DIR, check=True)
        
        # Step 2: bibtex (optional, if you have references)
        if os.path.exists(os.path.join(ACADEMIC_DIR, f'{REPORT_NAME}.aux')):
             print("📚 Processing bibliography...")
             subprocess.run(['bibtex', REPORT_NAME], cwd=ACADEMIC_DIR, capture_output=True)
        
        # Step 3: pdflatex (second pass for references/TOC)
        print("📥 Pass 2: Resolving references...")
        subprocess.run(['pdflatex', '-interaction=nonstopmode', f'{REPORT_NAME}.tex'], cwd=ACADEMIC_DIR, check=True)
        
        # Step 4: pdflatex (third pass for final layout)
        print("📥 Pass 3: Finalizing layout...")
        subprocess.run(['pdflatex', '-interaction=nonstopmode', f'{REPORT_NAME}.tex'], cwd=ACADEMIC_DIR, check=True)

        # Rename output
        pdf_path = os.path.join(ACADEMIC_DIR, f'{REPORT_NAME}.pdf')
        final_path = os.path.join(ACADEMIC_DIR, f'{OUTPUT_NAME}.pdf')
        if os.path.exists(pdf_path):
            if os.path.exists(final_path):
                os.remove(final_path)
            os.rename(pdf_path, final_path)
            print(f"✅ Success! PDF generated: {final_path}")
            return True
            
    except subprocess.CalledProcessError as e:
        print(f"❌ Compilation error. Check the log file in {ACADEMIC_DIR}")
        return False

if __name__ == "__main__":
    compile_latex()
