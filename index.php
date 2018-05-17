<?php

		$intranetPath = "intranet.lagtinget.ax";
		$intranetFilePath = "/var/www/" . $intranetPath;
		require "../" . $intranetPath . "/helpers.inc.php";

		?>
<!DOCTYPE html>
<html lang="sv" data-ng-app="view">
	<head>
		<meta charset="utf-8" />
		<title>Ålands lagting | Plenum </title>
		<meta http-equiv="X-UA-Compatible" content="IE=edge" />
		<meta content="width=device-width, initial-scale=1" name="viewport" />
		<meta content="Plenum" name="description" />
		<meta content="Ålands lagting" name="author" />
		<meta name="apple-mobile-web-app-capable" content="yes" />
		<base href="/" />
		<link href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet" />
		<?php	loadAndCache([
				"https://fonts.googleapis.com/css?family=Open+Sans:400,300,600,700&text=https://fonts.googleapis.com/css?family=Open+Sans:400,300,600,700&text=abc%C3%A4%C3%B6%C3%A5%C3%84%C3%96%C3%85%C3%BC%C3%9C",
				"https://" . $intranetPath . "/assets/global/plugins/bootstrap/css/bootstrap.min.css",
				"https://" . $intranetPath . "/assets/global/plugins/angular-loading-bar-0.9.0/angular-loading-bar-0.9.0.css",
				"https://client.lagtinget.ax/assets/css/bootwatch.slate.3.3.7.min.css",
				"https://view.lagtinget.ax/assets/custom/common.css",
				//	"https://view.lagtinget.ax/assets/custom/client.css",
				//	"https://view.lagtinget.ax/assets/custom/speaker.css",
				//	"https://view.lagtinget.ax/assets/custom/tv.css",
				], 'assets/view.cached.css', FALSE);
		?>
		<link rel="stylesheet" href="/assets/custom/client.css" />
		<link rel="stylesheet" href="/assets/custom/speaker.css" />
		<link rel="stylesheet" href="/assets/custom/tv.css" />
	</head>

	<body ng-cloak class="client">

		<div id="header" class="navbar navbar-default" ng-controller="view.topnav.controller as vm">
			<div class="container-fluid">
				<div class="row">

					<div class="col col-md-5">
						<h3 ng-if="vm.currentSeating && !vm.showCompanyName">
							{{ vm.currentSeating.type == '1' ? 'Plenum' : 'Frågestund' }}
						</h3>
						<h3 ng-if="vm.showCompanyName">Ålands Lagting</h3>
					</div>

					<div class="col col-md-2 text-center">
						<h3>
							<i class="fa fa-clock-o"></i> {{ vm.clock | date : 'H'}}{{ vm.showDots ? ':' : ' ' }}{{ vm.clock | date : 'mm' }}
						</h3>
					</div>

					<div class="col col-md-5">
						<h3 class="pull-right">
							<i class="fa fa-user-circle-o"></i> {{ vm.user.person.name ? vm.user.person.name : vm.currentSpeaker.name }}
						</h3>
					</div>

				</div>
			</div>
		</div>

		<div
			id="wrapper"
			class="container-fluid"
			dynamic-ctrl="''"
		></div>

<?php   loadAngularCore();

		loadAndCache([
		"https://cdnjs.cloudflare.com/ajax/libs/socket.io/1.5.1/socket.io.min.js",
		"https://" . $intranetPath . "/assets/global/plugins/lodash.min.js",
		"https://" . $intranetPath . "/assets/custom/moment/moment-with-locales.min.js",
		"https://" . $intranetPath . "/assets/custom/custom.js",
		"https://" . $intranetPath . "/assets/custom/angular-ui-router/angular-ui-router.min.js",
		"https://" . $intranetPath . "/assets/global/plugins/angularjs/plugins/restangular.min.js",
		"https://" . $intranetPath . "/assets/global/plugins/angular-loading-bar-0.9.0/angular-loading-bar-0.9.0.js",
		"https://view.lagtinget.ax/assets/angular-ocModal.js",
		"https://" . $intranetPath . "/app/common/common.constants.js",
		"https://intranet.lagtinget.ax/app/rest/rest.module.js",
		"https://intranet.lagtinget.ax/app/rest/rest.config.js",
		"https://intranet.lagtinget.ax/app/rest/rest.service.js",
		"https://intranet.lagtinget.ax/app/login/login.module.js",
		"https://intranet.lagtinget.ax/app/login/login.service.js",
		], 'assets/view.cached.js', TRUE);
?>

		<script src='/ws/ws.module.js' type='text/javascript'></script>
		<script src='/ws/ws.service.js' type='text/javascript'></script>

		<script src='/view/view.module.js' type='text/javascript'></script>

		<script src='/view/view.tv.controller.js' type='text/javascript'></script>
		<script src='/view/view.speaker.controller.js' type='text/javascript'></script>
		<script src='/view/view.client.controller.js' type='text/javascript'></script>

		<script src='/view/view.run.js' type='text/javascript'></script>

		<script src='/view/view.service.js' type='text/javascript'></script>
		<script src='/view/view.constants.js' type='text/javascript'></script>
		<script src='/view/view.directives.js' type='text/javascript'></script>
		<script src='/view/view.filters.js' type='text/javascript'></script>
		<script src='/view/view.config.js' type='text/javascript'></script>

		<script src='/view/topnav.controller.js' type='text/javascript'></script>

		<script type="text/javascript">
		//	angular.element(document.getElementsByTagName('head')).append(angular.element('<base href="' + window.location.pathname + '" />'));
		</script>

	</body>

</html>
