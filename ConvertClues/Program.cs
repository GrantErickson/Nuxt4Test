using System.Text;

if (args.Length < 2)
{
    Console.WriteLine("Usage: ConvertClues <input.tsv> <output.csv> [maxAnswerLength]");
    return;
}

string inputFile = args[0];
string outputFile = args[1];
int? maxAnswerLength = args.Length >= 3 ? int.Parse(args[2]) : null;

Console.WriteLine($"Processing input file: {inputFile}");
Console.WriteLine($"Output file: {outputFile}");
if (maxAnswerLength.HasValue)
{
    Console.WriteLine($"Maximum answer length: {maxAnswerLength.Value}");
}
Console.WriteLine();

var uniqueEntries = new HashSet<(string Answer, string Clue)>();
var answerClueCount = new Dictionary<string, int>();
int totalLines = 0;
int skippedBlankEntries = 0;
int skippedLongAnswers = 0;
int skippedNumbersSymbols = 0;
int skippedLongClues = 0;
int skippedTooManyClues = 0;
int duplicatesSkipped = 0;

foreach (var line in File.ReadLines(inputFile).Skip(1)) // Skip header
{
    totalLines++;
    var columns = line.Split('\t');
    if (columns.Length >= 4)
    {
        string answer = columns[2].Trim();
        string clue = columns[3].Trim();
        
        // Skip blank entries
        if (string.IsNullOrWhiteSpace(answer) || string.IsNullOrWhiteSpace(clue))
        {
            skippedBlankEntries++;
            continue;
        }
        
        // Skip answers with numbers or symbols (only allow letters and spaces)
        if (!IsLettersAndSpacesOnly(answer))
        {
            skippedNumbersSymbols++;
            continue;
        }
        
        // Skip clues longer than 30 characters
        if (clue.Length > 30)
        {
            skippedLongClues++;
            continue;
        }
        
        // Skip answers that exceed max length
        if (maxAnswerLength.HasValue && answer.Length > maxAnswerLength.Value)
        {
            skippedLongAnswers++;
            continue;
        }
        
        // Skip if answer already has 2 clues
        if (answerClueCount.GetValueOrDefault(answer) >= 2)
        {
            skippedTooManyClues++;
            continue;
        }
        
        // Track duplicates and update counts
        if (uniqueEntries.Add((answer, clue)))
        {
            answerClueCount[answer] = answerClueCount.GetValueOrDefault(answer) + 1;
        }
        else
        {
            duplicatesSkipped++;
        }
    }
}

// Sort alphabetically by answer
var sortedEntries = uniqueEntries.OrderBy(entry => entry.Answer).ToList();

using var writer = new StreamWriter(outputFile, false, Encoding.UTF8);
writer.WriteLine("answer\tclue");

foreach (var (answer, clue) in sortedEntries)
{
    writer.WriteLine($"{EscapeTsvField(answer)}\t{EscapeTsvField(clue)}");
}

Console.WriteLine("Conversion completed!");
Console.WriteLine($"Total lines processed: {totalLines:N0}");
Console.WriteLine($"Blank entries skipped: {skippedBlankEntries:N0}");
Console.WriteLine($"Answers with numbers/symbols skipped: {skippedNumbersSymbols:N0}");
Console.WriteLine($"Long clues skipped (>30 chars): {skippedLongClues:N0}");
Console.WriteLine($"Long answers skipped: {skippedLongAnswers:N0}");
Console.WriteLine($"Excess clues skipped (>2 per answer): {skippedTooManyClues:N0}");
Console.WriteLine($"Duplicate entries skipped: {duplicatesSkipped:N0}");
Console.WriteLine($"Unique entries written: {sortedEntries.Count:N0}");
Console.WriteLine($"Output saved to: {outputFile}");

// Create sample file
CreateSampleFile(outputFile, sortedEntries);

static string EscapeTsvField(string field)
{
    // For TSV, escape tabs, newlines, and carriage returns
    return field.Replace("\t", "\\t")
                .Replace("\n", "\\n")
                .Replace("\r", "\\r");
}

static bool IsLettersAndSpacesOnly(string text)
{
    return text.All(c => char.IsLetter(c) || char.IsWhiteSpace(c));
}

static void CreateSampleFile(string originalOutputFile, List<(string Answer, string Clue)> entries)
{
    var fileInfo = new FileInfo(originalOutputFile);
    var sampleFileName = Path.Combine(fileInfo.DirectoryName!, 
        $"{Path.GetFileNameWithoutExtension(fileInfo.Name)}-sample{fileInfo.Extension}");

    var sampleEntries = new List<(string Answer, string Clue)>();
    var usedAnswers = new HashSet<string>();

    // Group entries by first letter and collect unique answers (up to 10 per letter)
    for (char letter = 'A'; letter <= 'Z'; letter++)
    {
        var letterEntries = entries
            .Where(e => !string.IsNullOrEmpty(e.Answer) && char.ToUpper(e.Answer[0]) == letter && !usedAnswers.Contains(e.Answer))
            .Take(10)
            .ToList();

        foreach (var entry in letterEntries)
        {
            sampleEntries.Add(entry);
            usedAnswers.Add(entry.Answer);
        }
    }

    // Write sample file (entries are already sorted alphabetically by answer)
    using var writer = new StreamWriter(sampleFileName, false, Encoding.UTF8);
    writer.WriteLine("answer\tclue");

    foreach (var (answer, clue) in sampleEntries)
    {
        writer.WriteLine($"{EscapeTsvField(answer)}\t{EscapeTsvField(clue)}");
    }

    Console.WriteLine($"Sample file created: {sampleFileName}");
    Console.WriteLine($"Sample entries: {sampleEntries.Count:N0} (up to 10 per letter A-Z)");
}
