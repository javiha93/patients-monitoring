#!/usr/bin/env python3
"""
Parse test results from frontend (vitest JSON) and backend (surefire XML),
extract KAN-XX issue keys from test names, and post summary comments to JIRA.
"""

import json
import os
import re
import sys
import xml.etree.ElementTree as ET
from collections import defaultdict
from pathlib import Path
import urllib.request
import base64

JIRA_URL = os.environ.get("JIRA_URL", "")
JIRA_EMAIL = os.environ.get("JIRA_EMAIL", "")
JIRA_TOKEN = os.environ.get("JIRA_TOKEN", "")
RUN_URL = os.environ.get("RUN_URL", "")

KAN_PATTERN = re.compile(r"\[KAN-(\d+)\]")


def parse_vitest_json(path):
    """Parse vitest JSON output and return list of test results."""
    results = []
    try:
        with open(path) as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return results

    for suite in data.get("testResults", []):
        for test in suite.get("assertionResults", suite.get("assertionResults", [])):
            name = test.get("fullName", test.get("title", ""))
            status = test.get("status", "unknown")
            results.append({
                "name": name,
                "status": "passed" if status == "passed" else "failed",
                "source": "frontend",
                "message": "\n".join(test.get("failureMessages", [])),
            })

    # Fallback: try numPassedTests/numFailedTests structure
    if not results and "numPassedTests" in data:
        for suite in data.get("testResults", []):
            for test in suite.get("assertionResults", []):
                name = test.get("ancestorTitles", [])
                title = test.get("title", "")
                full = " > ".join(name + [title])
                status = test.get("status", "unknown")
                results.append({
                    "name": full,
                    "status": "passed" if status == "passed" else "failed",
                    "source": "frontend",
                    "message": "\n".join(test.get("failureMessages", [])),
                })

    return results


def parse_surefire_xml(directory):
    """Parse surefire XML reports and return list of test results."""
    results = []
    report_dir = Path(directory)
    if not report_dir.exists():
        return results

    for xml_file in report_dir.glob("TEST-*.xml"):
        try:
            tree = ET.parse(xml_file)
            root = tree.getroot()
        except ET.ParseError:
            continue

        for testcase in root.findall("testcase"):
            name = testcase.get("name", "")
            classname = testcase.get("classname", "")
            # Extract display name if available
            display = name
            failure = testcase.find("failure")
            error = testcase.find("error")
            skipped = testcase.find("skipped")

            if failure is not None:
                status = "failed"
                message = failure.get("message", "") + "\n" + (failure.text or "")
            elif error is not None:
                status = "failed"
                message = error.get("message", "") + "\n" + (error.text or "")
            elif skipped is not None:
                status = "skipped"
                message = ""
            else:
                status = "passed"
                message = ""

            results.append({
                "name": display,
                "classname": classname,
                "status": status,
                "source": "backend",
                "message": message.strip(),
            })

    return results


def group_by_issue(results):
    """Group test results by KAN issue key."""
    grouped = defaultdict(list)
    for r in results:
        matches = KAN_PATTERN.findall(r["name"])
        for num in matches:
            key = f"KAN-{num}"
            grouped[key].append(r)
    return grouped


def build_comment(issue_key, tests, run_url):
    """Build an ADF (Atlassian Document Format) comment for a JIRA issue."""
    passed = sum(1 for t in tests if t["status"] == "passed")
    failed = sum(1 for t in tests if t["status"] == "failed")
    total = len(tests)

    icon = "✅" if failed == 0 else "❌"
    header = f"{icon} Test Results: {passed}/{total} passed"

    rows = []
    for t in tests:
        emoji = "✅" if t["status"] == "passed" else "❌"
        source_badge = f"[{t['source']}]"
        rows.append(f"  {emoji} {source_badge} {t['name']}")

    body = header + "\n" + "\n".join(rows)
    if run_url:
        body += f"\n\n🔗 CI Run: {run_url}"

    return body


def post_comment(issue_key, body):
    """Post a comment to a JIRA issue using REST API v3."""
    url = f"{JIRA_URL}/rest/api/3/issue/{issue_key}/comment"
    auth = base64.b64encode(f"{JIRA_EMAIL}:{JIRA_TOKEN}".encode()).decode()

    # Build ADF body
    payload = {
        "body": {
            "version": 1,
            "type": "doc",
            "content": [
                {
                    "type": "codeBlock",
                    "attrs": {"language": "text"},
                    "content": [{"type": "text", "text": body}],
                }
            ],
        }
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Basic {auth}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req) as resp:
            print(f"  ✅ Posted to {issue_key} (HTTP {resp.status})")
    except urllib.error.HTTPError as e:
        print(f"  ❌ Failed to post to {issue_key}: HTTP {e.code} — {e.read().decode()[:200]}")


def main():
    frontend_json = sys.argv[1] if len(sys.argv) > 1 else "frontend/test-results.json"
    backend_xml_dir = sys.argv[2] if len(sys.argv) > 2 else "backend/target/surefire-reports"

    print("Parsing test results...")
    frontend_results = parse_vitest_json(frontend_json)
    backend_results = parse_surefire_xml(backend_xml_dir)
    all_results = frontend_results + backend_results

    print(f"  Frontend: {len(frontend_results)} tests")
    print(f"  Backend:  {len(backend_results)} tests")

    if not all_results:
        print("No test results found. Exiting.")
        return

    grouped = group_by_issue(all_results)
    print(f"\nFound {len(grouped)} JIRA issues referenced in tests:")

    if not JIRA_URL or not JIRA_EMAIL or not JIRA_TOKEN:
        print("⚠️  JIRA credentials not set. Printing results only.\n")
        for key, tests in sorted(grouped.items()):
            comment = build_comment(key, tests, RUN_URL)
            print(f"--- {key} ---")
            print(comment)
            print()
        return

    for key, tests in sorted(grouped.items()):
        comment = build_comment(key, tests, RUN_URL)
        print(f"\nPosting to {key} ({len(tests)} tests)...")
        post_comment(key, comment)

    # Print summary
    total_passed = sum(1 for r in all_results if r["status"] == "passed")
    total_failed = sum(1 for r in all_results if r["status"] == "failed")
    print(f"\n{'='*50}")
    print(f"Total: {len(all_results)} tests, {total_passed} passed, {total_failed} failed")
    print(f"Issues updated: {len(grouped)}")


if __name__ == "__main__":
    main()
