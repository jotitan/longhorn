package main
import (
    "fmt"
    "os"
    "path/filepath"
    "io/ioutil"
    "strings"
    "encoding/base64"
)



func main(){
    inputResourcesFolder := os.Args[1]
    // Insert generator files with data into specific package
    packageFolder := os.Args[2]
    resourcesFolder := os.Args[3]
    outFile,_ := os.OpenFile(filepath.Join(packageFolder,"autogenerate_resources.go"),os.O_CREATE|os.O_RDWR|os.O_TRUNC,os.ModePerm)
    outFile.WriteString("package " + packageFolder + "\n")
    outFile.WriteString("import \"os\"\n")
    outFile.WriteString("import \"strings\"\n")
    outFile.WriteString("import \"path/filepath\"\n")
    outFile.WriteString("import \"io/ioutil\"\n")
    outFile.WriteString("import \"encoding/base64\"\n")
    outFile.WriteString("import \"fmt\"\n\n")

    outFile.WriteString("var resourcesFolder = \"" + resourcesFolder + "\"\n\n")

    outFile.WriteString("func init(){\n")
    outFile.WriteString("files := map[string]string{\"\":\"\"")

    treat(outFile,inputResourcesFolder,"")
    outFile.WriteString("}\n\n")

    //outFile.WriteString("}\n\nfmt.Println(\"Check generating resources\")\n")
    writeCode(outFile,resourcesFolder)
    outFile.WriteString("}\n")
    outFile.Close()
}

func writeCode(out *os.File,resourcesFolder string){
    out.WriteString("if _,err := os.Open(resourcesFolder) ; err == nil{\n")
    out.WriteString("\treturn\n")
    out.WriteString("}\n")
    out.WriteString("\n\nfmt.Println(\"Generating resources in folder\",resourcesFolder)\n")
    out.WriteString("for name,data := range files {\n")
    out.WriteString("\tif name!=\"\" {\n")
    out.WriteString("\t\td:=resourcesFolder\n")

    out.WriteString(fmt.Sprintf("\t\tif idx:= strings.LastIndex(name,\"\\%c\") ; idx !=-1 {\n",os.PathSeparator))
    out.WriteString("\t\t\td=filepath.Join(d,name[:idx])\n")
    out.WriteString("\t\t}\n")
    out.WriteString("\t\tos.MkdirAll(d,os.ModePerm)\n")
    out.WriteString("\t\tdecodeData,_ := base64.StdEncoding.DecodeString(data)\n")
    out.WriteString("\t\tioutil.WriteFile(filepath.Join(resourcesFolder,name),decodeData,os.ModePerm)\n")
    out.WriteString("\t\tfmt.Println(\"=>\",d,\":\",name,len(decodeData))\n")
    out.WriteString("\t}\n}\n")

    out.WriteString("\n")
}

func treat(outFile *os.File,root,dir string){
    f,_ := os.Open(filepath.Join(root,dir))
    files,_ := f.Readdir(-1)

    //r2,_ := regexp.Compile("//.*\r\n")
    for _,file := range files {
        if file.IsDir() {
            dirName := filepath.Join(dir,file.Name())
            fmt.Println("DIR",dirName)
            treat(outFile,root,dirName)
        }else{
            in := filepath.Join(root,dir,file.Name())
            data,_ := ioutil.ReadFile(in)
            fmt.Println("TREAT",in)
            strData := base64.StdEncoding.EncodeToString(data)
            //strData := strings.Trim(string(r2.ReplaceAll(data,[]byte("")))," ")
            //strData := strings.Replace(strings.Replace(strings.Replace(string(data),"\\","\\\\",-1),"\"","\\\"",-1),"\r\n"," ",-1)
            //strData := strings.Replace(string(data),"`","``",-1)
            outFile.WriteString(",\"" + strings.Replace(filepath.Join(dir,file.Name()),"\\","\\\\",-1) + "\":`" + strData  + "`")
        }
    }
}
