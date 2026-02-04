@echo off
:: Stop all Nexora servers
title Stopping Nexora Servers...
powershell -ExecutionPolicy Bypass -File "%~dp0stop-project.ps1"
