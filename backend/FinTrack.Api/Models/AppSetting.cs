namespace FinTrack.Api.Models;

/// <summary>Simple key/value store. Used for the manually-adjustable total balance.</summary>
public class AppSetting
{
    public string Key { get; set; } = "";
    public string Value { get; set; } = "";
}
