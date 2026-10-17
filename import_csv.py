#!/usr/bin/env python3
"""
GBOT Certificate Verifier - CSV Database Importer
==================================================
Imports certificate records from a CSV file (with columns: Certificate ID, Name, Department)
directly into script.js while preserving formatting and avoiding duplicate entries.

Usage:
    python import_csv.py <path_to_csv> [--program "Program Name"] [--date "Date"] [--college "College"]
Example:
    python import_csv.py sample_certificates.csv
"""

import sys
import os
import csv
import json
import re
import argparse

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SCRIPT_JS_PATH = os.path.join(SCRIPT_DIR, "script.js")

def find_header_col(headers, candidates):
    norm_headers = [h.strip().lower().replace("_", " ").replace("-", " ") for h in headers]
    for c in candidates:
        if c.lower() in norm_headers:
            return norm_headers.index(c.lower())
    return None

def extract_existing_certificates(script_content):
    """Extract existing CERTIFICATES array from script.js."""
    pattern = re.compile(r"const\s+CERTIFICATES\s*=\s*(\[\s*[\s\S]*?\]);", re.MULTILINE)
    match = pattern.search(script_content)
    if not match:
        print("[!] Could not find 'const CERTIFICATES = [...];' in script.js.")
        return []
    
    raw_array = match.group(1)
    # Convert JS object-like syntax to standard JSON
    # 1. Remove comments
    cleaned = re.sub(r"//.*", "", raw_array)
    cleaned = re.sub(r"/\*[\s\S]*?\*/", "", cleaned)
    # 2. Quote unquoted keys: id:, name:, etc.
    cleaned = re.sub(r"([{,]\s*)([a-zA-Z0-9_]+)\s*:", r'\1"\2":', cleaned)
    # 3. Remove trailing commas before } or ]
    cleaned = re.sub(r",\s*([}\]])", r"\1", cleaned)

    try:
        return json.loads(cleaned)
    except Exception as e:
        print(f"[!] Warning: JSON parsing of existing array failed ({e}). Attempting regex item extraction...")
        # Fallback: regex search for object blocks
        certs = []
        obj_matches = re.finditer(r"\{([^{}]+)\}", raw_array)
        for obj_m in obj_matches:
            block = obj_m.group(1)
            c = {}
            for field in ["id", "name", "department", "college", "program", "module", "type", "date", "issuedBy"]:
                f_m = re.search(rf'{field}\s*:\s*["\']([^"\']*)["\']', block, re.IGNORECASE)
                if f_m:
                    c[field] = f_m.group(1).strip()
            if "id" in c and "name" in c:
                certs.append(c)
        return certs

def main():
    parser = argparse.ArgumentParser(description="Import certificate CSV into GBOT database in script.js")
    parser.add_argument("csv_file", help="Path to CSV file with Certificate ID, Name, Department")
    parser.add_argument("--program", default="G-Bot Maker Series: Concept to Circuit", help="Default program name")
    parser.add_argument("--college", default="Government Engineering College Wayanad", help="Default institution")
    parser.add_argument("--date", default="October 2026", help="Default issue date")
    parser.add_argument("--type", default="Certificate of Participation", help="Certificate type")
    parser.add_argument("--issuedBy", default="GBOT Robotics Club, GEC Wayanad", help="Issuing body")
    parser.add_argument("--module", default="", help="Module name (optional)")

    args = parser.parse_args()

    csv_path = os.path.abspath(args.csv_file)
    if not os.path.exists(csv_path):
        print(f"[ERROR] CSV file not found: {csv_path}")
        sys.exit(1)

    if not os.path.exists(SCRIPT_JS_PATH):
        print(f"[ERROR] script.js not found at: {SCRIPT_JS_PATH}")
        sys.exit(1)

    with open(csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        try:
            headers = next(reader)
        except StopIteration:
            print("[ERROR] CSV file is empty.")
            sys.exit(1)

        id_idx = find_header_col(headers, ["certificate id", "cert id", "certificate_id", "cert_id", "id"])
        name_idx = find_header_col(headers, ["name", "full name", "participant name", "student name"])
        dept_idx = find_header_col(headers, ["department", "dept", "branch"])

        if id_idx is None or name_idx is None or dept_idx is None:
            print(f"[ERROR] CSV must contain columns: 'Certificate ID', 'Name', and 'Department'.")
            print(f"Found headers: {headers}")
            sys.exit(1)

        new_certs = []
        for line_num, row in enumerate(reader, start=2):
            if not row or all(not cell.strip() for cell in row):
                continue
            cert_id = row[id_idx].strip() if len(row) > id_idx else ""
            name = row[name_idx].strip() if len(row) > name_idx else ""
            dept = row[dept_idx].strip() if len(row) > dept_idx else ""

            if not cert_id:
                print(f"[!] Warning: Row {line_num} has empty Certificate ID. Skipping.")
                continue

            new_certs.append({
                "id": cert_id,
                "name": name,
                "department": dept,
                "college": args.college,
                "program": args.program,
                "module": args.module,
                "type": args.type,
                "date": args.date,
                "issuedBy": args.issuedBy
            })

    print(f"[*] Read {len(new_certs)} valid record(s) from {os.path.basename(csv_path)}.")

    with open(SCRIPT_JS_PATH, "r", encoding="utf-8") as f:
        script_content = f.read()

    existing_certs = extract_existing_certificates(script_content)
    print(f"[*] Found {len(existing_certs)} existing record(s) in script.js.")

    # Merge records, deduplicating by ID (case-insensitive)
    cert_map = {}
    for c in existing_certs:
        cert_id_norm = c.get("id", "").strip().upper()
        if cert_id_norm:
            cert_map[cert_id_norm] = c

    added_count = 0
    updated_count = 0
    for nc in new_certs:
        cid_norm = nc["id"].strip().upper()
        if cid_norm in cert_map:
            # Update fields
            cert_map[cid_norm].update(nc)
            updated_count += 1
        else:
            cert_map[cid_norm] = nc
            added_count += 1

    merged_list = list(cert_map.values())

    # Format into neat JavaScript array representation
    js_lines = ["const CERTIFICATES = ["]
    for i, c in enumerate(merged_list):
        js_lines.append("  {")
        js_lines.append(f'    id: {json.dumps(c.get("id", ""))},')
        js_lines.append(f'    name: {json.dumps(c.get("name", ""))},')
        js_lines.append(f'    department: {json.dumps(c.get("department", ""))},')
        js_lines.append(f'    college: {json.dumps(c.get("college", ""))},')
        js_lines.append(f'    program: {json.dumps(c.get("program", ""))},')
        js_lines.append(f'    module: {json.dumps(c.get("module", ""))},')
        js_lines.append(f'    type: {json.dumps(c.get("type", ""))},')
        js_lines.append(f'    date: {json.dumps(c.get("date", ""))},')
        js_lines.append(f'    issuedBy: {json.dumps(c.get("issuedBy", ""))}')
        comma = "," if i < len(merged_list) - 1 else ""
        js_lines.append(f"  }}{comma}")
    js_lines.append("];")

    new_array_block = "\n".join(js_lines)

    # Replace array in script.js
    pattern = re.compile(r"const\s+CERTIFICATES\s*=\s*\[\s*[\s\S]*?\];", re.MULTILINE)
    if pattern.search(script_content):
        updated_content = pattern.sub(lambda m: new_array_block, script_content, count=1)
    else:
        print("[ERROR] Could not find insertion point for CERTIFICATES in script.js.")
        sys.exit(1)

    with open(SCRIPT_JS_PATH, "w", encoding="utf-8") as f:
        f.write(updated_content)

    print(f"[SUCCESS] Successfully updated script.js!")
    print(f"          + Added:   {added_count}")
    print(f"          + Updated: {updated_count}")
    print(f"          = Total:   {len(merged_list)} certificate(s) in database.")

if __name__ == "__main__":
    main()
