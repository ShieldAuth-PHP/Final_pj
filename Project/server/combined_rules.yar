/*
   Combined YARA Rule Set
   (detect_fakeupdate, detect_coinminer, detect_lumma, improve_vaccine, icedid 및 case_19772 룰 통합)
*/

rule case_19772_csrss_cobalt_strike {
   meta:
      description = "19772 - file csrss.exe"
      author = "TheDFIRReport"
      date = "2024-01-09"
   strings:
      $x1 = "Invalid owner %s is already associated with %s=This control requires version 4.70 or greater of COMCTL32.DLL" fullword wide
      $s2 = "traydemo.exe" fullword ascii
      $s3 = "333330303030333333" ascii
      $s4 = "323232323233323232323233333333333333" ascii
      $s5 = "333333333333333333333333333333333333333333333333333333333333333333333333" ascii
      $s6 = "Borland C++ - Copyright 2002 Borland Corporation" fullword ascii
      $s7 = "@Cdiroutl@TCDirectoryOutline@GetChildNamed$qqrrx17System@AnsiStringl" fullword ascii
      $s8 = "2a1d2V1p1" fullword ascii
      $s9 = "Separator\"Unable to find a Table of Contents" fullword wide
      $s10 = "EInvalidGraphicOperation4" fullword ascii
      $s11 = ")Failed to read ImageList data from stream(Failed to write ImageList data to stream$Error creating window device context" fullword wide
      $s12 = "%s: %s error" fullword ascii
      $s13 = "@TTrayIcon@GetAnimate$qqrv" fullword ascii
      $s14 = "ImageTypeh" fullword ascii
      $s15 = "42464:4`4d4 3" fullword ascii
      $s16 = "333333333333333333333333(" fullword ascii
      $s17 = ")\"\")\"\")#3232" fullword ascii
      $s18 = "OnGetItem(3B" fullword ascii
      $s19 = "@Cspin@TCSpinEdit@GetValue$qqrv" fullword ascii
      $s20 = "@Cspin@TCSpinButton@GetUpGlyph$qqrv" fullword ascii
   condition:
      uint16(0) == 0x5a4d and filesize < 3000KB and
      1 of ($x*) and 4 of them
}

rule case_19772_svchost_nokoyawa_ransomware {
   meta:
      description = "19772 - file svchost.exe"
      author = "TheDFIRReport"
      date = "2024-01-09"
   strings:
      $s1 = " ;3;!X" fullword ascii
      $s2 = "bcdedit" fullword wide
      $s3 = "geKpgAX3" fullword ascii
      $s4 = "shutdown" fullword wide
      $s5 = "k2mm7KvHl51n2LJDYLanAgM48OX97gkV" fullword ascii
      $s6 = "+TDPbuWCWNmcW0k=" fullword ascii
      $s7 = "4vEBlUlgJ5oeqmbpb9OSaQrQb8bRWNqP" fullword ascii
      $s8 = "2aDXUPxh3ZZ1x8tpfg6PxcMuUwWogOgQ" fullword ascii
      $s9 = "kfeCWydRqz8=" fullword ascii
      $s10 = "ZfrMxxDy" fullword ascii
      $s11 = "eLTuGYHd" fullword ascii
      $s12 = "wWIQZ5jJPZIiuDKxQVh0YO3HnzdOwirY" fullword ascii
      $s13 = "+IdWS+zG9rUG" fullword ascii
      $s14 = "0ZdUoZmp" fullword ascii
      $s15 = "SVWh$l@" fullword ascii
      $s16 = "Z2mJzxHFaRafgf4k/uTdeMKIMUpV/y81" fullword ascii
      $s17 = "GtKqGSOfNUOVIoMTk8bGZVchMddKIuTN" fullword ascii
      $s18 = "INMvjo3GzuQ6MTSJUg==" fullword ascii
      $s19 = "hilWGBcFwE80e5L9BXxCiRiE" fullword ascii
      $s20 = "gSMSrcOR" fullword ascii
   condition:
      uint16(0) == 0x5a4d and filesize < 70KB and
      8 of them
}

rule case_19772_anydesk_id_tool {
   meta:
      description = "19772 - file GET_ID.bat"
      author = "TheDFIRReport"
      date = "2024-01-09"
   strings:
      $x1 = "for /f \"delims=\" %%i in ('C:\\ProgramData\\Any\\AnyDesk.exe --get-id') do set ID=%%i " fullword ascii
      $s2 = "echo AnyDesk ID is: %ID%" fullword ascii
   condition:
      uint16(0) == 0x6540 and filesize < 1KB and
      1 of ($x*) and all of them
}

rule case_19772_anydesk_installer {
   meta:
      description = "19772 - file INSTALL.ps1"
      author = "TheDFIRReport"
      date = "2024-01-09"
   strings:
      $x1 = "    cmd.exe /c echo btc1000qwe123 | C:\\ProgramData\\Any\\AnyDesk.exe --set-password" fullword ascii
      $x2 = "    cmd.exe /c C:\\ProgramData\\AnyDesk.exe --install C:\\ProgramData\\Any --start-with-win --silent" fullword ascii
      $s3 = "    #reg add \"HKEY_LOCAL_MACHINE\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon\\SpecialAccounts\\Userlist\" /v Inn" ascii
      $s4 = "    #reg add \"HKEY_LOCAL_MACHINE\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon\\SpecialAccounts\\Userlist\" /v Inn" ascii
      $s5 = "    $url = \"http://download.anydesk.com/AnyDesk.exe\"" fullword ascii
      $s6 = "EG_DWORD /d 0 /f" fullword ascii
      $s7 = "    $file = \"C:\\ProgramData\\AnyDesk.exe\"" fullword ascii
      $s8 = "    $clnt = new-object System.Net.WebClient" fullword ascii
      $s9 = "    #net user AD \"2020\" /add" fullword ascii
      $s10 = "    # Download AnyDesk" fullword ascii
      $s11 = "    mkdir \"C:\\ProgramData\\Any\"" fullword ascii
      $s12 = "    $clnt.DownloadFile($url,$file)" fullword ascii
      $s13 = "    #net localgroup Administrators InnLine /ADD" fullword ascii
   condition:
      uint16(0) == 0x0a0d and filesize < 1KB and
      1 of ($x*) and 4 of them
}

rule detect_fakeupdate_html {
   meta:
      description = "Detects Fake Browser Update HTML page"
      author = "User"
   strings:
      $alert = "Your browser is out of date! Please update now." wide
      $redirect = "http://127.0.0.1:5000/malware.exe" ascii
   condition:
      $alert and $redirect
}

rule detect_coinminer {
   meta:
      description = "Detects CoinMiner pattern"
      author = "User"
   strings:
      $pattern1 = "coinminer" ascii nocase
      $pattern2 = "mining" ascii nocase
   condition:
      $pattern1 or $pattern2
}

rule detect_lumma {
   meta:
      description = "Detects Lumma malware pattern"
      author = "User"
   strings:
      $lumma = "lumma" ascii nocase
   condition:
      $lumma
}

rule detect_improve_vaccine {
   meta:
      description = "Detects Improve Vaccine tool pattern"
      author = "User"
   strings:
      $vaccine = "improve_vaccine" ascii nocase
   condition:
      $vaccine
}

rule detect_icedid {
   meta:
      description = "Detects IcedID malware"
      author = "User"
   strings:
      $icedid = "IcedID" ascii nocase
   condition:
      $icedid
}