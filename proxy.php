<?php

class Documentmodel  {

	public function __construct() {
	}

	private function everything_in_tags($string, $tagname, $id) {
		$string = utf8_decode($string);
		$document = new DOMDocument();
		$document->loadHtml($string);
		$xpath = new DOMXpath($document);
		$result = '';
		foreach ($xpath->evaluate('//' . $tagname) as $node) {
			$result .= $document->saveHtml($node);
		}

		$result = str_replace("<body", "<div id='parsed-document' ", $result);
		$result = str_replace("</body>", "</div>", $result);

		return $result;
	}

	private function getTextBetweenTags($tag, $html, $strict=0) {
		$dom = new domDocument;
		if($strict==1) {
			$dom->loadXML($html);
		} else {
			@$dom->loadHTML($html);
		}

		$dom->preserveWhiteSpace = false;
		$content = $dom->getElementsByTagname($tag);
		$out = array();
		foreach ($content as $item) {
			$out[] = $item->nodeValue;
		}
		return $out;
	}

	public function getFile($file) {

			$parts = parse_url($file);
			$out = Array();

			$out['protocol'] = (strpos(strtolower($parts['path']), '/pp') > -1 || strpos(strtolower($parts['path']), '/fl') > -1) ? true : false;

			if (
				(
					$parts['host'] === "dokument.lagtinget.ax"
				)
				&&
				(strpos($parts['path'], "/handlingar/") === 0 || strpos($parts['path'], "/plenum/") === 0)
			) {

				$ch = curl_init();

				curl_setopt($ch, CURLOPT_AUTOREFERER, TRUE);
				curl_setopt($ch, CURLOPT_HEADER, 0);
				curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
				curl_setopt($ch, CURLOPT_URL, $file);
				curl_setopt($ch, CURLOPT_FOLLOWLOCATION, TRUE);
				if ($parts['scheme'] == 'https') {
					curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, FALSE);
					curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);
				}
				$contentData = utf8_encode(curl_exec($ch));
				$resultStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
				curl_close($ch);

				if ($resultStatus == 200) {

					$document = new DOMDocument();
					@$document->loadHTML($contentData);
					$xpath = new DOMXPath($document);

					$css = $this->getTextBetweenTags('style', $contentData);
					$css[0] = str_replace("@", ".___", $css[0]);
					$css[0] = str_replace("text-align:justify;", "text-align: left;", $css[0]);

	                $out['css'] = $css[0];
	                $bodyContent = $this->everything_in_tags($contentData, 'body', $out['id']);

	                $bodyContent = str_replace("\r\n", " ", $bodyContent);
//		$bodyContent = preg_replace( "/src=\"(.*?-filer\/image\d\d\d\.)/" , "src=\"https://" . $parts['host'] . dirname($parts['path']) . "/$1"  , $bodyContent);
		$bodyContent = preg_replace( "/src=\"(.*?-filer\/image\d\d\d\.)/" , "src=\"data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==\""  , $bodyContent);
	                $bodyContent = preg_replace("/<a name=\"(.*?)\">(.*?)<\/a>/si", "<span id=\"$1\">$2</span>", $bodyContent);

	                $bodyContent = preg_replace("/font-size:\s?11\.0pt/si", "font-size: inherit", $bodyContent);

	//				$bodyContent = preg_replace("/([:\s])(\d+?(.*?)?)(cm|pt)/" , "$1 calc(~\"1.4 * $2$4\") " , $bodyContent);

					$thisDirectory = explode("/", $file);
					array_pop($thisDirectory);
					$thisDirectory = implode("/", $thisDirectory) . "/";
					//$thisDirectory = LT_DOCS;
	                $bodyContent = preg_replace("/href=\"([\%\\/\\w-_]*?\\.pdf)\"/si", "", $bodyContent);

	                $out['content'] = $bodyContent;



				} else {
					header("HTTP/1.1 404 Not Found");
				}

			}


		return $out;
	}

}


$docInstance = new Documentmodel();
$thisDocument = $docInstance->getFile($_GET['file']);

?>
<html>
	<head>

		<style>
			<?=$thisDocument['css'];?>

			body {

				zoom: 150%;

			-webkit-touch-callout: none; /* iOS Safari */
				-webkit-user-select: none; /* Safari */
				-khtml-user-select: none; /* Konqueror HTML */
				-moz-user-select: none; /* Firefox */
				-ms-user-select: none; /* Internet Explorer/Edge */
				user-select: none; /* Non-prefixed version, currently supported by Chrome and Opera */

				background: #333;
			}

			* {
				text-decoration: none;
				color: white !important;
				cursor: none !important;
				pointer-events: none;
			}

			* [class*="MsoToc"] a, * [class*="MsoToc"] a * {
				pointer-events: auto;
			}

		</style>
	</head>

	<body>

		<?=$thisDocument['content'];?>


		<script>

			document.addEventListener('contextmenu', event => event.preventDefault());
		</script>
	</body>
</html>
